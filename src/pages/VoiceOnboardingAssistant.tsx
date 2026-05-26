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
import { Phone, Plus, Upload, CheckCircle2, XCircle, Clock, MessageCircle, Send, Trash2, Pencil } from "lucide-react";
import { toast } from "sonner";

interface OnboardingContact {
  id: string;
  phone_number: string;
  contact_type: "chef" | "customer";
  name: string | null;
  area: string | null;
  contact_status: string;
  created_at: string;
  whatsapp_sent: boolean;
  whatsapp_sent_at: string | null;
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

interface WhatsAppMessage {
  id: string;
  contact_id: string | null;
  phone_number: string;
  message_text: string;
  message_type: string;
  is_read: boolean;
  created_at: string;
}

const VoiceOnboardingAssistant = () => {
  const [contacts, setContacts] = useState<OnboardingContact[]>([]);
  const [callLogs, setCallLogs] = useState<CallLog[]>([]);
  const [whatsappMessages, setWhatsappMessages] = useState<WhatsAppMessage[]>([]);
  const [inboxUnread, setInboxUnread] = useState(0);
  const [loading, setLoading] = useState(true);
  const [calling, setCalling] = useState(false);
  const [sendingWhatsApp, setSendingWhatsApp] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [editingContact, setEditingContact] = useState<OnboardingContact | null>(null);
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
    fetchWhatsAppMessages();

    // Live updates: new inbound messages appear instantly
    const channel = supabase
      .channel("whatsapp_inbox_live")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "whatsapp_messages" },
        (payload) => {
          const msg = payload.new as WhatsAppMessage;
          setWhatsappMessages((prev) => [msg, ...prev]);
          setInboxUnread((n) => n + 1);
          toast.info(`New reply from ${msg.phone_number}`);
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const fetchContacts = async (showToast = false) => {
    setRefreshing(true);
    try {
      const { data, error } = await (supabase as any)
        .from("onboarding_contacts")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setContacts(data || []);
      if (showToast) toast.success("Contacts refreshed");
    } catch (error) {
      console.error("Error fetching contacts:", error);
      toast.error("Failed to load contacts");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchWhatsAppMessages = async () => {
    try {
      const { data, error } = await (supabase as any)
        .from("whatsapp_messages")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      const msgs: WhatsAppMessage[] = data || [];
      setWhatsappMessages(msgs);
      setInboxUnread(msgs.filter((m) => !m.is_read).length);
    } catch (error) {
      console.error("Error fetching WhatsApp messages:", error);
    }
  };

  const markRead = async (id: string) => {
    await (supabase as any)
      .from("whatsapp_messages")
      .update({ is_read: true })
      .eq("id", id);
    setWhatsappMessages((prev) =>
      prev.map((m) => (m.id === id ? { ...m, is_read: true } : m))
    );
    setInboxUnread((n) => Math.max(0, n - 1));
  };

  const markAllRead = async () => {
    await (supabase as any)
      .from("whatsapp_messages")
      .update({ is_read: true })
      .eq("is_read", false);
    setWhatsappMessages((prev) => prev.map((m) => ({ ...m, is_read: true })));
    setInboxUnread(0);
  };

  const deleteMessage = async (id: string) => {
    await (supabase as any).from("whatsapp_messages").delete().eq("id", id);
    setWhatsappMessages((prev) => prev.filter((m) => m.id !== id));
    setInboxUnread((n) => {
      const wasUnread = whatsappMessages.find((m) => m.id === id)?.is_read === false;
      return wasUnread ? Math.max(0, n - 1) : n;
    });
  };

  const clearReadMessages = async () => {
    if (!window.confirm("Delete all read messages?")) return;
    await (supabase as any)
      .from("whatsapp_messages")
      .delete()
      .eq("is_read", true);
    setWhatsappMessages((prev) => prev.filter((m) => !m.is_read));
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

  const sendWhatsApp = async (contact: OnboardingContact) => {
    setSendingWhatsApp(true);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-onboarding-whatsapp`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
          },
          body: JSON.stringify({
            contact_id: contact.id,
            phone_number: contact.phone_number,
            language: selectedLanguage,
          }),
        }
      );

      const result = await response.json();

      if (response.ok && result.success) {
        toast.success(`WhatsApp sent to ${contact.phone_number}`);
        fetchContacts();
      } else {
        toast.error(`Failed: ${result.error}`);
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to send WhatsApp");
    } finally {
      setSendingWhatsApp(false);
    }
  };

  const sendWhatsAppToAll = async (all = false) => {
    const targets = all ? contacts : contacts.filter((c) => !c.whatsapp_sent);
    if (targets.length === 0) {
      toast.info("No contacts to message");
      return;
    }

    setSendingWhatsApp(true);
    let successCount = 0;
    const session = (await supabase.auth.getSession()).data.session;

    for (const contact of targets) {
      try {
        const response = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-onboarding-whatsapp`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${session?.access_token}`,
            },
            body: JSON.stringify({
              contact_id: contact.id,
              phone_number: contact.phone_number,
              language: selectedLanguage,
            }),
          }
        );
        const result = await response.json();
        if (result.success) successCount++;
      } catch {}
    }

    toast.success(`WhatsApp sent to ${successCount} of ${targets.length} contacts`);
    fetchContacts();
    setSendingWhatsApp(false);
  };

  const deleteContact = async (contact: OnboardingContact) => {
    if (!window.confirm(`Delete ${contact.name || contact.phone_number}?`)) return;
    try {
      const { error } = await (supabase as any)
        .from("onboarding_contacts")
        .delete()
        .eq("id", contact.id);
      if (error) throw error;
      toast.success("Contact deleted");
      fetchContacts();
    } catch (error: any) {
      toast.error(error.message || "Failed to delete contact");
    }
  };

  const saveEdit = async () => {
    if (!editingContact) return;
    try {
      const { error } = await (supabase as any)
        .from("onboarding_contacts")
        .update({
          name: editingContact.name,
          phone_number: editingContact.phone_number,
          contact_type: editingContact.contact_type,
          area: editingContact.area,
          updated_at: new Date().toISOString(),
        })
        .eq("id", editingContact.id);
      if (error) throw error;
      toast.success("Contact updated");
      setEditingContact(null);
      fetchContacts();
    } catch (error: any) {
      toast.error(error.message || "Failed to update contact");
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
              <div className="flex flex-col gap-3 w-full">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <CardTitle>
                    Onboarding Contacts ({contacts.filter((c) => statusFilter === "all" || c.contact_status === statusFilter).length}
                    {statusFilter !== "all" && ` of ${contacts.length}`})
                  </CardTitle>
                  <Button variant="outline" size="sm" onClick={() => fetchContacts(true)} disabled={refreshing}>
                    {refreshing ? "Refreshing…" : "Refresh"}
                  </Button>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Label className="text-sm shrink-0">Language:</Label>
                  <Select value={selectedLanguage} onValueChange={setSelectedLanguage as any}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="telugu">🇮🇳 Telugu</SelectItem>
                      <SelectItem value="english">🇬🇧 English</SelectItem>
                    </SelectContent>
                  </Select>
                  <Label className="text-sm shrink-0">Filter:</Label>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-36">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      <SelectItem value="interested">Interested</SelectItem>
                      <SelectItem value="not_contacted">Not Contacted</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="contacted">Contacted</SelectItem>
                    </SelectContent>
                  </Select>
                  <div className="ml-auto flex gap-2">
                    <Button
                      size="sm"
                      variant="secondary"
                      disabled={sendingWhatsApp}
                      onClick={() => sendWhatsAppToAll(false)}
                    >
                      <Send className="h-4 w-4 mr-1" />
                      {sendingWhatsApp ? "Sending…" : `Send Unsent (${contacts.filter((c) => !c.whatsapp_sent).length})`}
                    </Button>
                    <Button
                      size="sm"
                      variant="default"
                      disabled={sendingWhatsApp}
                      onClick={() => sendWhatsAppToAll(true)}
                    >
                      <Send className="h-4 w-4 mr-1" />
                      {sendingWhatsApp ? "Sending…" : `Resend All (${contacts.length})`}
                    </Button>
                  </div>
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
                        <TableHead>WhatsApp</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {contacts
                        .filter((c) => statusFilter === "all" || c.contact_status === statusFilter)
                        .map((contact) => (
                        <TableRow
                          key={contact.id}
                          className={contact.contact_status === "interested" ? "bg-green-50 dark:bg-green-950/20" : ""}
                        >
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
                                {contact.contact_status.replace(/_/g, " ")}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              {contact.whatsapp_sent && (
                                <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" />
                              )}
                              <Button
                                size="sm"
                                variant={contact.whatsapp_sent ? "ghost" : "outline"}
                                disabled={sendingWhatsApp}
                                onClick={() => sendWhatsApp(contact)}
                              >
                                <MessageCircle className="h-4 w-4 mr-1" />
                                {contact.whatsapp_sent ? "Resend" : "Send"}
                              </Button>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1 flex-wrap">
                              <a
                                href={`https://wa.me/${contact.phone_number.replace(/\D/g, "")}`}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                <Button size="sm" variant="default">
                                  <Phone className="h-4 w-4 mr-1" />
                                  WA Call
                                </Button>
                              </a>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setEditingContact({ ...contact })}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => deleteContact(contact)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Edit Contact Dialog */}
          {editingContact && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <div className="bg-background rounded-lg p-6 w-full max-w-md space-y-4 shadow-xl">
                <h2 className="text-lg font-semibold">Edit Contact</h2>
                <div>
                  <Label>Phone Number</Label>
                  <Input
                    value={editingContact.phone_number}
                    onChange={(e) => setEditingContact({ ...editingContact, phone_number: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Name</Label>
                  <Input
                    value={editingContact.name || ""}
                    onChange={(e) => setEditingContact({ ...editingContact, name: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Contact Type</Label>
                  <Select
                    value={editingContact.contact_type}
                    onValueChange={(v: any) => setEditingContact({ ...editingContact, contact_type: v })}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="chef">Chef 👨‍🍳</SelectItem>
                      <SelectItem value="customer">Customer 👥</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Area</Label>
                  <Input
                    value={editingContact.area || ""}
                    onChange={(e) => setEditingContact({ ...editingContact, area: e.target.value })}
                  />
                </div>
                <div className="flex gap-2 pt-2">
                  <Button onClick={saveEdit} className="flex-1">Save</Button>
                  <Button variant="outline" onClick={() => setEditingContact(null)} className="flex-1">Cancel</Button>
                </div>
              </div>
            </div>
          )}

          {/* WhatsApp Inbox */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between flex-wrap gap-2">
                <CardTitle className="flex items-center gap-2">
                  <MessageCircle className="h-5 w-5 text-green-600" />
                  WhatsApp Inbox
                  {inboxUnread > 0 && (
                    <Badge variant="destructive">{inboxUnread} new</Badge>
                  )}
                </CardTitle>
                <div className="flex gap-2">
                  {inboxUnread > 0 && (
                    <Button variant="outline" size="sm" onClick={markAllRead}>
                      Mark all read
                    </Button>
                  )}
                  {whatsappMessages.some((m) => m.is_read) && (
                    <Button variant="outline" size="sm" onClick={clearReadMessages}>
                      <Trash2 className="h-4 w-4 mr-1" />
                      Clear read
                    </Button>
                  )}
                  <Button variant="outline" size="sm" onClick={fetchWhatsAppMessages}>
                    Refresh
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {whatsappMessages.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">
                  No replies yet — messages from recipients will appear here
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-2"></TableHead>
                        <TableHead>From</TableHead>
                        <TableHead>Message</TableHead>
                        <TableHead className="whitespace-nowrap">Time</TableHead>
                        <TableHead></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {whatsappMessages.map((msg) => {
                        const contact = contacts.find((c) => c.id === msg.contact_id);
                        return (
                          <TableRow
                            key={msg.id}
                            className={
                              !msg.is_read
                                ? "bg-green-50 dark:bg-green-950/20 cursor-pointer"
                                : "cursor-pointer"
                            }
                            onClick={() => !msg.is_read && markRead(msg.id)}
                          >
                            <TableCell>
                              {!msg.is_read && (
                                <div className="w-2 h-2 rounded-full bg-green-500" />
                              )}
                            </TableCell>
                            <TableCell>
                              <div className="font-mono text-sm">{msg.phone_number}</div>
                              {contact && (
                                <div className="text-xs text-muted-foreground">
                                  {contact.name || contact.contact_type}
                                </div>
                              )}
                            </TableCell>
                            <TableCell className="max-w-xs">
                              <p className={`text-sm truncate ${!msg.is_read ? "font-medium" : ""}`}>
                                {msg.message_text}
                              </p>
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                              {new Date(msg.created_at).toLocaleString()}
                            </TableCell>
                            <TableCell>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={(e) => { e.stopPropagation(); deleteMessage(msg.id); }}
                              >
                                <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })}
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
