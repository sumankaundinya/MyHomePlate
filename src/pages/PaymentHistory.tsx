import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { IndianRupee, ArrowLeft, Download, CreditCard, RefreshCw } from "lucide-react";
import { format } from "date-fns";
import { getCommissionPercentage } from "@/lib/commissionUtils";

interface PaymentRecord {
  id: string;
  total_price: number;
  status: string;
  payment_id: string | null;
  payment_status: string | null;
  refund_id: string | null;
  refund_status: string | null;
  created_at: string;
  meals: { title: string } | null;
  profiles: { name: string } | null;
}

const PaymentHistory = () => {
  const navigate = useNavigate();
  const [records, setRecords] = useState<PaymentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [commissionRate, setCommissionRate] = useState(0);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      toast.error("Please sign in");
      navigate("/login");
      return;
    }
    const rate = await getCommissionPercentage();
    setCommissionRate(rate);
    fetchRecords(session.user.id);
  };

  const fetchRecords = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("orders")
        .select("id, total_price, status, payment_id, payment_status, refund_id, refund_status, created_at, meals (title)")
        .eq("chef_id", userId)
        .not("payment_status", "is", null)
        .order("created_at", { ascending: false });

      if (error) throw error;

      const withCustomers = await Promise.all(
        (data || []).map(async (rec: any) => {
          const { data: profile } = await supabase
            .from("profiles")
            .select("name")
            .eq("id", rec.customer_id)
            .maybeSingle();
          return { ...rec, profiles: profile };
        })
      );

      setRecords(withCustomers);
    } catch (err: any) {
      console.error(err);
      toast.error("Failed to load payment history");
    } finally {
      setLoading(false);
    }
  };

  const chefShare = (price: number) => price * ((100 - commissionRate) / 100);
  const platformFee = (price: number) => price * (commissionRate / 100);

  const totalPaid = records
    .filter((r) => r.payment_status === "paid" && r.status !== "cancelled")
    .reduce((sum, r) => sum + chefShare(r.total_price), 0);

  const totalRefunded = records
    .filter((r) => r.refund_status === "processed")
    .reduce((sum, r) => sum + chefShare(r.total_price), 0);

  const paymentStatusVariant = (status: string | null) => {
    if (status === "paid") return "default";
    if (status === "failed") return "destructive";
    return "secondary";
  };

  const refundLabel = (r: PaymentRecord) => {
    if (r.refund_status === "processed") return "Refunded";
    if (r.refund_status === "failed") return "Refund Failed";
    return null;
  };

  const exportCSV = () => {
    const header = "Date,Meal,Customer,Order Total,Your Share,Platform Fee,Payment Status,Refund Status,Payment ID\n";
    const rows = records
      .map((r) =>
        [
          format(new Date(r.created_at), "yyyy-MM-dd"),
          `"${r.meals?.title ?? ""}"`,
          `"${r.profiles?.name ?? ""}"`,
          r.total_price.toFixed(2),
          chefShare(r.total_price).toFixed(2),
          platformFee(r.total_price).toFixed(2),
          r.payment_status ?? "",
          r.refund_status ?? "",
          r.payment_id ?? "",
        ].join(",")
      )
      .join("\n");

    const blob = new Blob([header + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `payment-history-${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="flex items-center gap-3 mb-6">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-3xl font-bold">Payment History</h1>
            <p className="text-muted-foreground text-sm">All your transactions in one place</p>
          </div>
          <Button variant="outline" size="sm" onClick={exportCSV} disabled={records.length === 0}>
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>

        {/* Summary Cards */}
        <div className="grid md:grid-cols-3 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Net Earnings</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">₹{totalPaid.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">{100 - commissionRate}% of revenue</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Transactions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{records.filter((r) => r.payment_status === "paid").length}</div>
              <p className="text-xs text-muted-foreground">Successful payments</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Refunded</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-500">₹{totalRefunded.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">{records.filter((r) => r.refund_status === "processed").length} refunds</p>
            </CardContent>
          </Card>
        </div>

        {/* Transaction List */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <RefreshCw className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : records.length === 0 ? (
          <Card>
            <CardContent className="py-16 text-center">
              <CreditCard className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-1">No transactions yet</h3>
              <p className="text-muted-foreground text-sm">Payment records will appear here once customers pay for orders.</p>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Transactions</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y">
                {records.map((rec) => (
                  <div key={rec.id} className="flex items-start gap-4 p-4 hover:bg-muted/30 transition-colors">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{rec.meals?.title ?? "—"}</p>
                      <p className="text-sm text-muted-foreground">
                        {rec.profiles?.name ?? "Customer"} · {format(new Date(rec.created_at), "d MMM yyyy, h:mm a")}
                      </p>
                      {rec.payment_id && (
                        <p className="text-xs text-muted-foreground font-mono mt-0.5 truncate">
                          {rec.payment_id}
                        </p>
                      )}
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-bold text-green-600">₹{chefShare(rec.total_price).toFixed(2)}</p>
                      <p className="text-xs text-muted-foreground">of ₹{rec.total_price.toFixed(2)}</p>
                      <div className="flex gap-1 justify-end mt-1 flex-wrap">
                        <Badge variant={paymentStatusVariant(rec.payment_status) as any} className="text-xs">
                          {rec.payment_status ?? "pending"}
                        </Badge>
                        {refundLabel(rec) && (
                          <Badge variant="outline" className="text-xs">
                            {refundLabel(rec)}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {commissionRate > 0 && (
          <p className="text-xs text-muted-foreground text-center mt-6">
            Platform commission: {commissionRate}%. Your share: {100 - commissionRate}% of each order.
          </p>
        )}
      </div>
    </div>
  );
};

export default PaymentHistory;
