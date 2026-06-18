export interface Book {
  id: number;
  title: string;
  author: string;
  isbn: string;
  category: string;
  publisher: string;
  publish_date: string;
  quantity: number;
  available: number;
  location: string;
  language: string;
  rating: number;
  review_count: number;
  cover_color: string;
}

export interface Reader {
  id: number;
  reader_id: string;
  name: string;
  email: string;
  phone: string;
  student_id: string;
  reader_type: string;
  status: string;
  borrow_limit: number;
  fines: number;
  expiry_date: string;
  joined_at: string;
  avatar_color: string;
  current_borrowing?: number;
}

export interface Activity {
  id: number;
  type: string;
  book_title: string;
  reader_name: string;
  status: string;
  created_at: string;
}

export interface Borrowing {
  id: number;
  borrowed_at: string;
  due_date: string;
  returned_at?: string;
  status: string;
  reader_name: string;
  book_title: string;
  renewed_count?: number;
}

export interface ActiveBorrowing {
  id: number;
  borrowed_at: string;
  due_date: string;
  status: string;
  book_title: string;
  isbn: string;
  book_id?: number;
  reader_name?: string;
  reader_id?: string;
  renewed_count?: number;
}

export interface CheckoutResult {
  success: boolean;
  dueDate: string;
  checkoutDate: string;
  items: { id: number; bookTitle: string; isbn: string }[];
  reader: { name: string; readerId: string };
}

export interface DashboardStats {
  totalCollection: number;
  currentBorrowing: number;
  overdue: number;
  newReaders: number;
}

export interface Settings {
  [key: string]: string;
}

export interface User {
  id: number;
  email: string;
  name: string;
  role: string;
}

export interface Notification {
  id: number;
  title: string;
  message: string;
  type: string;
  read: number;
  created_at: string;
}
