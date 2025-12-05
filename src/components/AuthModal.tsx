import { useNavigate } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ChefHat, UtensilsCrossed } from "lucide-react";

interface AuthModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const AuthModal = ({ open, onOpenChange }: AuthModalProps) => {
  const navigate = useNavigate();

  const handleSignUp = () => {
    onOpenChange(false);
    navigate("/signup");
  };

  const handleLogin = () => {
    onOpenChange(false);
    navigate("/login");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <UtensilsCrossed className="h-8 w-8 text-primary" />
          </div>
          <DialogTitle className="text-2xl">
            Sign up to order homemade meals near you!
          </DialogTitle>
          <DialogDescription className="text-base pt-2">
            Join MyHomePlate to enjoy authentic home-cooked Indian dishes from
            verified local chefs.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-3 pt-4">
          <Button size="lg" onClick={handleSignUp} className="w-full">
            <ChefHat className="mr-2 h-5 w-5" />
            Create Account
          </Button>
          <Button
            size="lg"
            variant="outline"
            onClick={handleLogin}
            className="w-full"
          >
            Already have an account? Log in
          </Button>
        </div>
        <p className="text-center text-sm text-muted-foreground pt-2">
          Browse meals freely, sign up when you're ready to order!
        </p>
      </DialogContent>
    </Dialog>
  );
};

export default AuthModal;
