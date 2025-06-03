export interface OrderItem {
  title: string;
  quantity: number;
  price: number;
}

export interface User {
  name: string;
  phone: string;
  address?: string;
  googleAddress?: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  stripeId: string;
  createdAt: string;
  amount: number;
  status: string;
  orderNote?: string;
  items: OrderItem[];
  user: User;
  restaurant: {
    name: string;
  };
}
