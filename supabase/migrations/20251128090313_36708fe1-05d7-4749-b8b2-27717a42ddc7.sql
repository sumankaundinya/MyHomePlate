-- Create addresses table for user locations
CREATE TABLE public.addresses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  address_line TEXT NOT NULL,
  area TEXT NOT NULL,
  pincode TEXT NOT NULL,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  is_primary BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create chefs table for detailed chef profiles
CREATE TABLE public.chefs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  bio TEXT,
  kitchen_photo_url TEXT,
  verification_status TEXT DEFAULT 'pending' CHECK (verification_status IN ('pending', 'approved', 'rejected')),
  hygiene_certificate BOOLEAN DEFAULT false,
  fssai_license BOOLEAN DEFAULT false,
  is_featured BOOLEAN DEFAULT false,
  avg_rating DECIMAL(3, 2) DEFAULT 0,
  total_reviews INTEGER DEFAULT 0,
  total_orders INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create chef_specialties table
CREATE TABLE public.chef_specialties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chef_id UUID REFERENCES public.chefs(id) ON DELETE CASCADE NOT NULL,
  specialty TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Add customization columns to meals table
ALTER TABLE public.meals
ADD COLUMN spice_levels TEXT[] DEFAULT ARRAY['low', 'medium', 'high'],
ADD COLUMN oil_options TEXT[] DEFAULT ARRAY['low', 'normal'],
ADD COLUMN min_quantity INTEGER DEFAULT 1,
ADD COLUMN max_quantity INTEGER DEFAULT 10;

-- Create order_items table for detailed order tracking with customizations
CREATE TABLE public.order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE NOT NULL,
  meal_id UUID REFERENCES public.meals(id) ON DELETE CASCADE NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  spice_level TEXT,
  oil_preference TEXT,
  price_per_unit NUMERIC NOT NULL,
  subtotal NUMERIC NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Update orders table for delivery flow
ALTER TABLE public.orders
ADD COLUMN delivery_partner_id UUID REFERENCES auth.users(id),
ADD COLUMN delivery_address_id UUID REFERENCES public.addresses(id),
ADD COLUMN delivery_instructions TEXT,
ADD COLUMN scheduled_delivery_time TIMESTAMP WITH TIME ZONE,
ADD COLUMN actual_delivery_time TIMESTAMP WITH TIME ZONE;

-- Update order status to support full delivery flow
ALTER TABLE public.orders
DROP CONSTRAINT IF EXISTS orders_status_check,
ADD CONSTRAINT orders_status_check CHECK (status IN ('pending', 'accepted', 'rejected', 'preparing', 'out_for_delivery', 'delivered', 'cancelled'));

-- Create subscriptions table
CREATE TABLE public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  chef_id UUID REFERENCES public.chefs(id) ON DELETE CASCADE NOT NULL,
  plan_type TEXT NOT NULL CHECK (plan_type IN ('weekly', 'monthly')),
  meals_count INTEGER NOT NULL,
  meals_remaining INTEGER NOT NULL,
  price_per_meal NUMERIC NOT NULL,
  total_price NUMERIC NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'paused', 'cancelled', 'completed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create subscription_meals table for meal calendar
CREATE TABLE public.subscription_meals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id UUID REFERENCES public.subscriptions(id) ON DELETE CASCADE NOT NULL,
  meal_id UUID REFERENCES public.meals(id) ON DELETE CASCADE NOT NULL,
  delivery_date DATE NOT NULL,
  status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'delivered', 'skipped')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create reviews table
CREATE TABLE public.reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chef_id UUID REFERENCES public.chefs(id) ON DELETE CASCADE NOT NULL,
  customer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  photo_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  UNIQUE(order_id, customer_id)
);

-- Enable RLS on all new tables
ALTER TABLE public.addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chefs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chef_specialties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_meals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- RLS Policies for addresses
CREATE POLICY "Users can view own addresses" ON public.addresses FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own addresses" ON public.addresses FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own addresses" ON public.addresses FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own addresses" ON public.addresses FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for chefs
CREATE POLICY "Anyone can view approved chefs" ON public.chefs FOR SELECT USING (verification_status = 'approved');
CREATE POLICY "Chefs can view own profile" ON public.chefs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Chefs can update own profile" ON public.chefs FOR UPDATE USING (auth.uid() = user_id AND has_role(auth.uid(), 'chef'::app_role));
CREATE POLICY "Admins can view all chefs" ON public.chefs FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can update any chef" ON public.chefs FOR UPDATE USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for chef_specialties
CREATE POLICY "Anyone can view specialties" ON public.chef_specialties FOR SELECT USING (true);
CREATE POLICY "Chefs can manage own specialties" ON public.chef_specialties FOR ALL USING (
  EXISTS (SELECT 1 FROM public.chefs WHERE chefs.id = chef_specialties.chef_id AND chefs.user_id = auth.uid())
);

-- RLS Policies for order_items
CREATE POLICY "Customers can view own order items" ON public.order_items FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.orders WHERE orders.id = order_items.order_id AND orders.customer_id = auth.uid())
);
CREATE POLICY "Chefs can view order items for their meals" ON public.order_items FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.orders WHERE orders.id = order_items.order_id AND orders.chef_id = auth.uid())
);
CREATE POLICY "Customers can insert order items" ON public.order_items FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.orders WHERE orders.id = order_items.order_id AND orders.customer_id = auth.uid())
);

-- RLS Policies for subscriptions
CREATE POLICY "Customers can view own subscriptions" ON public.subscriptions FOR SELECT USING (auth.uid() = customer_id);
CREATE POLICY "Customers can create subscriptions" ON public.subscriptions FOR INSERT WITH CHECK (auth.uid() = customer_id);
CREATE POLICY "Chefs can view subscriptions for their kitchen" ON public.subscriptions FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.chefs WHERE chefs.id = subscriptions.chef_id AND chefs.user_id = auth.uid())
);

-- RLS Policies for subscription_meals
CREATE POLICY "Customers can view own subscription meals" ON public.subscription_meals FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.subscriptions WHERE subscriptions.id = subscription_meals.subscription_id AND subscriptions.customer_id = auth.uid())
);
CREATE POLICY "Chefs can view meals for their subscriptions" ON public.subscription_meals FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.subscriptions s
    JOIN public.chefs c ON c.id = s.chef_id
    WHERE s.id = subscription_meals.subscription_id AND c.user_id = auth.uid()
  )
);

-- RLS Policies for reviews
CREATE POLICY "Anyone can view reviews" ON public.reviews FOR SELECT USING (true);
CREATE POLICY "Customers can create reviews for own orders" ON public.reviews FOR INSERT WITH CHECK (
  auth.uid() = customer_id AND
  EXISTS (SELECT 1 FROM public.orders WHERE orders.id = reviews.order_id AND orders.customer_id = auth.uid() AND orders.status = 'delivered')
);
CREATE POLICY "Customers can update own reviews" ON public.reviews FOR UPDATE USING (auth.uid() = customer_id);

-- Add triggers for updated_at
CREATE TRIGGER update_addresses_updated_at BEFORE UPDATE ON public.addresses FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_chefs_updated_at BEFORE UPDATE ON public.chefs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_subscriptions_updated_at BEFORE UPDATE ON public.subscriptions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_subscription_meals_updated_at BEFORE UPDATE ON public.subscription_meals FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_reviews_updated_at BEFORE UPDATE ON public.reviews FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to calculate distance between two coordinates (Haversine formula)
CREATE OR REPLACE FUNCTION public.calculate_distance(
  lat1 DECIMAL,
  lon1 DECIMAL,
  lat2 DECIMAL,
  lon2 DECIMAL
) RETURNS DECIMAL
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  radius DECIMAL := 6371; -- Earth's radius in km
  dlat DECIMAL;
  dlon DECIMAL;
  a DECIMAL;
  c DECIMAL;
BEGIN
  dlat := radians(lat2 - lat1);
  dlon := radians(lon2 - lon1);
  a := sin(dlat/2) * sin(dlat/2) + cos(radians(lat1)) * cos(radians(lat2)) * sin(dlon/2) * sin(dlon/2);
  c := 2 * atan2(sqrt(a), sqrt(1-a));
  RETURN radius * c;
END;
$$;

-- Function to update chef stats when review is added
CREATE OR REPLACE FUNCTION public.update_chef_stats()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.chefs
  SET 
    avg_rating = (SELECT AVG(rating) FROM public.reviews WHERE chef_id = NEW.chef_id),
    total_reviews = (SELECT COUNT(*) FROM public.reviews WHERE chef_id = NEW.chef_id)
  WHERE id = NEW.chef_id;
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_chef_stats_on_review
AFTER INSERT OR UPDATE ON public.reviews
FOR EACH ROW
EXECUTE FUNCTION update_chef_stats();

-- Create indexes for performance
CREATE INDEX idx_addresses_user_id ON public.addresses(user_id);
CREATE INDEX idx_chefs_user_id ON public.chefs(user_id);
CREATE INDEX idx_chefs_verification_status ON public.chefs(verification_status);
CREATE INDEX idx_chef_specialties_chef_id ON public.chef_specialties(chef_id);
CREATE INDEX idx_order_items_order_id ON public.order_items(order_id);
CREATE INDEX idx_subscriptions_customer_id ON public.subscriptions(customer_id);
CREATE INDEX idx_subscriptions_chef_id ON public.subscriptions(chef_id);
CREATE INDEX idx_subscription_meals_subscription_id ON public.subscription_meals(subscription_id);
CREATE INDEX idx_reviews_chef_id ON public.reviews(chef_id);
CREATE INDEX idx_reviews_customer_id ON public.reviews(customer_id);