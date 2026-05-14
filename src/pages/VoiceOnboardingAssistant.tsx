import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Phone, Plus, Upload, CheckCircle2, XCircle, Clock } from "lucide-react";
import { toast } from "sonner";

interface OnboardingContact {
  id: string;
  phone_number: string;
  contact_type: "chef" | "customer";
  name: string | null;
  area: string | null;
  contact_status: string;
  created_at: string;
}

interface CallLog {
  id: string;
  contact_id: string;
  phone_number: string;
  call_status: string;
  call_type: string;
  created_at: string;
  call_duration_seconds: number | null;
}

const VoiceOnboardingAssistant = () => {
  const [contacts, setContacts] = useState<OnboardingContact[]>([]);
  const [callLogs, setCallLogs] = useState<CallLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [calling, setCalling] = useState(false);
  const [selectedContactType, setSelectedContactType] = useState<"chef" | "customer">("chef");
  const [selectedLanguage, setSelectedLanguage] = useState<"telugu" | "english">("telugu");

  // Form state
  const [formData, setFormData] = useState({
    phone_number: "",
    contact_type: "chef" as "chef" | "customer",
    name: "",
    area: "Nizampet",
  });

  const [bulkPhones, setBulkPhones] = useState("");

  useEffect(() => {
    fetchContacts();
    fetchCallLogs();
  }, []);

  const fetchContacts = async () => {
    try {
      const { data, error } = await (supabase as any)
        .from("onboarding_contacts")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setContacts(data || []);
    } catch (error) {
      console.error("Error fetching contacts:", error);
      toast.error("Failed to load contacts");
    } finally {
      setLoading(false);
    }
  };

  const fetchCallLogs = async () => {
    try {
      const { data, error } = await (supabase as any)
        .from("voice_call_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) throw error;
      setCallLogs(data || []);
    } catch (error) {
      console.error("Error fetching call logs:", error);
    }
  };

  const addContact = async () => {
    if (!formData.phone_number.trim()) {
      toast.error("Please enter a phone number");
      return;
    }

    try {
      const { error } = await (supabase as any).from("onboarding_contacts").insert({
        phone_number: formData.phone_number.trim(),
        contact_type: formData.contact_type,
        name: formData.name || null,
        area: formData.area || null,
      });

      if (error) throw error;
      toast.success("Contact added!");
      setFormData({ phone_number: "", contact_type: "chef", name: "", area: "Nizampet" });
      fetchContacts();
    } catch (error: any) {
      toast.error(error.message || "Failed to add contact");
    }
  };

  const addBulkContacts = async () => {
    if (!bulkPhones.trim()) {
      toast.error("Please enter phone numbers");
      return;
    }

    const phones = bulkPhones
      .split("\n")
      .map((p) => p.trim())
      .filter((p) => p.length > 0);

    if (phones.length === 0) {
      toast.error("No valid phone numbers found");
      return;
    }

    try {
      const contactsToInsert = phones.map((phone) => ({
        phone_number: phone,
        contact_type: selectedContactType,
        area: "Nizampet",
      }));

      const { error } = await (supabase as any)
        .from("onboarding_contacts")
        .insert(contactsToInsert);

      if (error) throw error;
      toast.success(`Added ${phones.length} contacts!`);
      setBulkPhones("");
      fetchContacts();
    } catch (error: any) {
      toast.error(error.message || "Failed to add bulk contacts");
    }
  };

  const initiateCall = async (contact: OnboardingContact) => {
    setCalling(true);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/initiate-voice-call`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
          },
          body: JSON.stringify({
            contact_id: contact.id,
            phone_number: contact.phone_number,
            contact_type: contact.contact_type,
            contact_name: contact.name,
            call_type: contact.contact_type === "chef" ? "chef_onboarding" : "customer_acquisition",
            language: selectedLanguage,
          }),
        }
      );

      const result = await response.json();

      if (response.ok && result.success) {
        toast.success(`Calling ${contact.phone_number}...`);
        fetchCallLogs();
        fetchContacts();
      } else {
        toast.error(`Failed to initiate call: ${result.error}`);
      }
    } catch (error: any) {
      console.error("Error initiating call:", error);
      toast.error(error.message || "Failed to initiate call");
    } finally {
      setCalling(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "interested":
      case "completed":
        return <CheckCircle2 className="h-4 w-4 text-green-600" />;
      case "not_interested":
      case "failed":
        return <XCircle className="h-4 w-4 text-red-600" />;
      case "pending":
      case "in-progress":
        return <Clock className="h-4 w-4 text-yellow-600" />;
      default:
        return null;
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    if (status.includes("interested")) return "default";
    if (status.includes("failed") || status === "not_interested") return "destructive";
    if (status.includes("pending") || status === "in-progress") return "secondary";
    return "outline";
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold mb-2 flex items-center gap-2">
            <Phone className="h-6 w-6 text-primary" />
            Voice Onboarding Assistant
          </h1>
          <p className="text-muted-foreground">
            Call chefs and customers to personally onboard them into MyHomePlate
          </p>
        </div>

        <div className="grid gap-6">
          {/* Add Single Contact */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="h-5 w-5" />
                Add Contact
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="+91 98765 43210"
                      value={formData.phone_number}
                      onChange={(e) =>
                        setFormData({ ...formData, phone_number: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="name">Name (optional)</Label>
                    <Input
                      id="name"
                      placeholder="John Doe"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="type">Contact Type</Label>
                    <Select
                      value={formData.contact_type}
                      onValueChange={(value: any) =>
                        setFormData({ ...formData, contact_type: value })
                      }
                    >
                      <SelectTrigger id="type">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="chef">Chef 👨‍🍳</SelectItem>
                        <SelectItem value="customer">Customer 👥</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="area">Area</Label>
                    <Input
                      id="area"
                      placeholder="Nizampet"
                      value={formData.area}
                      onChange={(e) => setFormData({ ...formData, area: e.target.value })}
                    />
                  </div>
                </div>

                <Button onClick={addContact} className="w-full">
                  Add Contact
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Bulk Upload */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                Bulk Add Contacts
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="bulk">Contact Type for Bulk Upload</Label>
                  <Select value={selectedContactType} onValueChange={setSelectedContactType as any}>
                    <SelectTrigger id="bulk">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="chef">Chefs</SelectItem>
                      <SelectItem value="customer">Customers</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="phones">Phone Numbers (one per line)</Label>
                  <Textarea
                    id="phones"
                    placeholder="+91 98765 43210
+91 98765 43211
+91 98765 43212"
                    rows={6}
                    value={bulkPhones}
                    onChange={(e) => setBulkPhones(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground mt-2">
                    Paste phone numbers directly or from Excel
                  </p>
                </div>

                {(() => {
                  const count = bulkPhones.split("\n").filter((p) => p.trim()).length;
                  return (
                    <Button onClick={addBulkContacts} className="w-full" disabled={count === 0}>
                      {count === 0 ? "Paste numbers above to add" : `Add ${count} Contact${count !== 1 ? "s" : ""}`}
                    </Button>
                  );
                })()}
              </div>
            </CardContent>
          </Card>

          {/* Contacts List */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between flex-wrap gap-4">
                <CardTitle>Onboarding Contacts ({contacts.length})</CardTitle>
                <div className="flex items-center gap-2">
                  <Label htmlFor="language" className="mr-2">
                    Call Language:
                  </Label>
                  <Select value={selectedLanguage} onValueChange={setSelectedLanguage as any}>
                    <SelectTrigger id="language" className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="telugu">🇮🇳 Telugu</SelectItem>
                      <SelectItem value="english">🇬🇧 English</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button variant="outline" size="sm" onClick={fetchContacts}>
                    Refresh
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <p className="text-muted-foreground">Loading contacts...</p>
              ) : contacts.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">No contacts yet</p>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Phone</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {contacts.map((contact) => (
                        <TableRow key={contact.id}>
                          <TableCell className="font-mono">{contact.phone_number}</TableCell>
                          <TableCell>{contact.name || "—"}</TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {contact.contact_type === "chef" ? "👨‍🍳" : "👥"}{" "}
                              {contact.contact_type}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {getStatusIcon(contact.contact_status)}
                              <span className="text-sm capitalize">
                                {contact.contact_status}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Button
                              size="sm"
                              variant="default"
                              disabled={calling}
                              onClick={() => initiateCall(contact)}
                            >
                              <Phone className="h-4 w-4 mr-1" />
                              {calling ? "Calling…" : "Call"}
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Call Logs */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Recent Call Logs</CardTitle>
                <Button variant="outline" size="sm" onClick={fetchCallLogs}>
                  Refresh
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {callLogs.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">No calls yet</p>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Phone</TableHead>
                        <TableHead>Call Status</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Duration</TableHead>
                        <TableHead>Time</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {callLogs.map((log) => (
                        <TableRow key={log.id}>
                          <TableCell className="font-mono">{log.phone_number}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {getStatusIcon(log.call_status)}
                              <Badge variant={getStatusBadgeVariant(log.call_status)}>
                                {log.call_status}
                              </Badge>
                            </div>
                          </TableCell>
                          <TableCell className="text-sm">
                            {log.call_type.replace(/_/g, " ")}
                          </TableCell>
                          <TableCell>
                            {log.call_duration_seconds
                              ? `${log.call_duration_seconds}s`
                              : "—"}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {new Date(log.created_at).toLocaleTimeString()}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default VoiceOnboardingAssistant;
