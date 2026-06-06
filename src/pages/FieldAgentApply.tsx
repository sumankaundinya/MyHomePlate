import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CheckCircle2, MapPin, Phone, User, Briefcase } from "lucide-react";
import { toast } from "sonner";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

const FieldAgentApply = () => {
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: "",
    phone: "",
    area: "",
    experience: "",
    message: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.name.trim() || !form.phone.trim() || !form.area.trim()) {
      toast.error("Please fill in all required fields");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${SUPABASE_URL}/functions/v1/field-agent-apply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Something went wrong. Please try again.");
        return;
      }

      setSubmitted(true);
    } catch {
      toast.error("Network error. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50 flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="h-10 w-10 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-3">Application Received!</h2>
          <p className="text-gray-600 mb-2">
            Thank you for your interest in joining MyHomePlate as a Field Agent.
          </p>
          <p className="text-gray-600">
            Our team will review your application and contact you on <strong>{form.phone}</strong> within 2 business days.
          </p>
          <div className="mt-8 p-4 bg-orange-50 border border-orange-200 rounded-lg">
            <p className="text-sm text-orange-700">
              You can also WhatsApp us directly at <strong>+91 63032 31913</strong> if you have any questions.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-orange-500 to-amber-500 text-white py-12 px-4 text-center">
        <h1 className="text-3xl font-bold mb-2">MyHomePlate</h1>
        <p className="text-orange-100 text-sm mb-6">Homemade food, delivered with love</p>
        <h2 className="text-2xl font-semibold mb-3">Join Us as a Field Agent</h2>
        <p className="text-orange-100 max-w-xl mx-auto text-sm leading-relaxed">
          Visit home cooks in your area, help them join MyHomePlate, and earn
          ₹200 for every chef you successfully onboard. Flexible hours, no targets.
        </p>
      </div>

      {/* Benefits */}
      <div className="max-w-xl mx-auto px-4 py-8">
        <div className="grid grid-cols-3 gap-4 mb-8 text-center">
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <div className="text-2xl mb-1">💰</div>
            <p className="text-xs font-semibold text-gray-700">₹200 Per Chef</p>
            <p className="text-xs text-gray-500">Every verified onboarding</p>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <div className="text-2xl mb-1">🕐</div>
            <p className="text-xs font-semibold text-gray-700">Flexible Hours</p>
            <p className="text-xs text-gray-500">Work your own schedule</p>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <div className="text-2xl mb-1">📍</div>
            <p className="text-xs font-semibold text-gray-700">Work Locally</p>
            <p className="text-xs text-gray-500">In your own area</p>
          </div>
        </div>

        {/* Form */}
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-6">Apply Now — It's Free</h3>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <Label htmlFor="name" className="flex items-center gap-2 mb-1.5">
                <User className="h-4 w-4 text-orange-500" /> Full Name *
              </Label>
              <Input
                id="name"
                placeholder="Enter your full name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
            </div>

            <div>
              <Label htmlFor="phone" className="flex items-center gap-2 mb-1.5">
                <Phone className="h-4 w-4 text-orange-500" /> WhatsApp Number *
              </Label>
              <Input
                id="phone"
                type="tel"
                placeholder="+91 98765 43210"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                required
              />
              <p className="text-xs text-gray-400 mt-1">We will contact you on this number</p>
            </div>

            <div>
              <Label htmlFor="area" className="flex items-center gap-2 mb-1.5">
                <MapPin className="h-4 w-4 text-orange-500" /> City / Area *
              </Label>
              <Input
                id="area"
                placeholder="e.g. Nizampet, Hyderabad"
                value={form.area}
                onChange={(e) => setForm({ ...form, area: e.target.value })}
                required
              />
            </div>

            <div>
              <Label htmlFor="experience" className="flex items-center gap-2 mb-1.5">
                <Briefcase className="h-4 w-4 text-orange-500" /> Field Sales Experience
              </Label>
              <Select
                value={form.experience}
                onValueChange={(v) => setForm({ ...form, experience: v })}
              >
                <SelectTrigger id="experience">
                  <SelectValue placeholder="Select your experience level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No experience (fresher)</SelectItem>
                  <SelectItem value="less_than_1">Less than 1 year</SelectItem>
                  <SelectItem value="1_to_3">1 – 3 years</SelectItem>
                  <SelectItem value="3_to_5">3 – 5 years</SelectItem>
                  <SelectItem value="5_plus">5+ years</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="message" className="mb-1.5 block">
                Anything else you'd like to tell us? (optional)
              </Label>
              <Textarea
                id="message"
                placeholder="Tell us about yourself, your availability, or why you want to join..."
                rows={3}
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
              />
            </div>

            <Button
              type="submit"
              className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 text-base"
              disabled={loading}
            >
              {loading ? "Submitting…" : "Submit Application"}
            </Button>

            <p className="text-xs text-gray-400 text-center">
              By submitting you agree to be contacted by MyHomePlate regarding this role.
            </p>
          </form>
        </div>
      </div>
    </div>
  );
};

export default FieldAgentApply;
