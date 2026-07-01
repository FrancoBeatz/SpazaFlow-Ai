import { 
  Product, Sale, Expense, Supplier, MarketplaceProduct, 
  SupplierOrder, CustomerLoyalty, Employee, CommunityMarketplaceItem, 
  AuditLog, BusinessHealth 
} from '../types';

export const API_BASE = '/api';

// Core apiFetch handler with automatic JWT injection
export async function apiFetch<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem('spazaflow_token');
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message || `Request failed with status ${response.status}`);
  }

  return data.data !== undefined ? data.data : data;
}

// -------------------------------------------------------------
// AUTHENTICATION APIs
// -------------------------------------------------------------
export async function apiSignIn(email: string, password: string) {
  const res = await apiFetch<any>('/auth/signin', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
  if (res.token) {
    localStorage.setItem('spazaflow_token', res.token);
  }
  return res;
}

export async function apiSignUp(payload: any) {
  const res = await apiFetch<any>('/auth/signup', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  if (res.token) {
    localStorage.setItem('spazaflow_token', res.token);
  }
  return res;
}

export async function apiGetMe() {
  return apiFetch<any>('/auth/me');
}

// -------------------------------------------------------------
// BUSINESSES/TENANCY APIs
// -------------------------------------------------------------
export async function apiGetBusinesses() {
  return apiFetch<any[]>('/businesses');
}

export async function apiCreateBusiness(payload: any) {
  return apiFetch<any>('/businesses', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function apiUpdateBusinessTier(tier: string) {
  return apiFetch<any>('/businesses/tier', {
    method: 'PUT',
    body: JSON.stringify({ tier }),
  });
}

// -------------------------------------------------------------
// PRODUCTS APIs
// -------------------------------------------------------------
export async function apiGetProducts() {
  return apiFetch<Product[]>('/products');
}

export async function apiCreateProduct(product: Partial<Product>) {
  return apiFetch<Product>('/products', {
    method: 'POST',
    body: JSON.stringify(product),
  });
}

export async function apiUpdateProduct(id: string, product: Partial<Product>) {
  return apiFetch<Product>(`/products/${id}`, {
    method: 'PUT',
    body: JSON.stringify(product),
  });
}

export async function apiBulkUpdateProductPrices(updates: { id: string; costPrice: number; sellingPrice: number }[]) {
  return apiFetch<Product[]>('/products/bulk-update', {
    method: 'PUT',
    body: JSON.stringify({ updates }),
  });
}

export async function apiDeleteProduct(id: string) {
  return apiFetch<any>(`/products/${id}`, {
    method: 'DELETE',
  });
}

// -------------------------------------------------------------
// SALES APIs
// -------------------------------------------------------------
export async function apiGetSales() {
  return apiFetch<Sale[]>('/sales');
}

export async function apiCreateSale(sale: Partial<Sale>) {
  return apiFetch<Sale>('/sales', {
    method: 'POST',
    body: JSON.stringify(sale),
  });
}

// -------------------------------------------------------------
// EXPENSES APIs
// -------------------------------------------------------------
export async function apiGetExpenses() {
  return apiFetch<Expense[]>('/expenses');
}

export async function apiCreateExpense(expense: Partial<Expense>) {
  return apiFetch<Expense>('/expenses', {
    method: 'POST',
    body: JSON.stringify(expense),
  });
}

// -------------------------------------------------------------
// SUPPLIERS APIs
// -------------------------------------------------------------
export async function apiGetSuppliers() {
  return apiFetch<Supplier[]>('/suppliers');
}

export async function apiCreateSupplier(supplier: Partial<Supplier>) {
  return apiFetch<Supplier>('/suppliers', {
    method: 'POST',
    body: JSON.stringify(supplier),
  });
}

// Wholesales Marketplace Products (provided as global wholesale items)
export async function apiGetMarketplaceProducts() {
  return apiFetch<MarketplaceProduct[]>('/marketplace');
}

// -------------------------------------------------------------
// SUPPLIER ORDERS APIs
// -------------------------------------------------------------
export async function apiGetSupplierOrders() {
  return apiFetch<SupplierOrder[]>('/supplier-orders');
}

export async function apiCreateSupplierOrder(order: Partial<SupplierOrder>) {
  return apiFetch<SupplierOrder>('/supplier-orders', {
    method: 'POST',
    body: JSON.stringify(order),
  });
}

export async function apiUpdateSupplierOrder(id: string, payload: Partial<SupplierOrder>) {
  return apiFetch<SupplierOrder>(`/supplier-orders/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

// -------------------------------------------------------------
// CUSTOMER LOYALTY APIs
// -------------------------------------------------------------
export async function apiGetLoyalty() {
  return apiFetch<CustomerLoyalty[]>('/loyalty');
}

export async function apiCreateLoyalty(loyalty: Partial<CustomerLoyalty>) {
  return apiFetch<CustomerLoyalty>('/loyalty', {
    method: 'POST',
    body: JSON.stringify(loyalty),
  });
}

export async function apiUpdateLoyalty(id: string, loyalty: Partial<CustomerLoyalty>) {
  return apiFetch<CustomerLoyalty>(`/loyalty/${id}`, {
    method: 'PUT',
    body: JSON.stringify(loyalty),
  });
}

// -------------------------------------------------------------
// EMPLOYEES APIs
// -------------------------------------------------------------
export async function apiGetEmployees() {
  return apiFetch<Employee[]>('/employees');
}

export async function apiCreateEmployee(employee: Partial<Employee>) {
  return apiFetch<Employee>('/employees', {
    method: 'POST',
    body: JSON.stringify(employee),
  });
}

export async function apiUpdateEmployee(id: string, employee: Partial<Employee>) {
  return apiFetch<Employee>(`/employees/${id}`, {
    method: 'PUT',
    body: JSON.stringify(employee),
  });
}

// -------------------------------------------------------------
// COMMUNITY MARKETPLACE APIs
// -------------------------------------------------------------
export async function apiGetCommunityExchange() {
  return apiFetch<CommunityMarketplaceItem[]>('/community');
}

export async function apiCreateCommunityListing(item: Partial<CommunityMarketplaceItem>) {
  return apiFetch<CommunityMarketplaceItem>('/community', {
    method: 'POST',
    body: JSON.stringify(item),
  });
}

export async function apiUpdateCommunityListing(id: string, item: Partial<CommunityMarketplaceItem>) {
  return apiFetch<CommunityMarketplaceItem>(`/community/${id}`, {
    method: 'PUT',
    body: JSON.stringify(item),
  });
}

// -------------------------------------------------------------
// AUDIT LOGS APIs
// -------------------------------------------------------------
export async function apiGetAuditLogs() {
  return apiFetch<AuditLog[]>('/audit-logs');
}

export async function apiCreateAuditLog(log: Partial<AuditLog>) {
  return apiFetch<AuditLog>('/audit-logs', {
    method: 'POST',
    body: JSON.stringify(log),
  });
}

// -------------------------------------------------------------
// WEB NOTIFICATIONS APIs
// -------------------------------------------------------------
export async function apiGetNotifications() {
  return apiFetch<any[]>('/notifications');
}

export async function apiCreateNotification(notif: any) {
  return apiFetch<any>('/notifications', {
    method: 'POST',
    body: JSON.stringify(notif),
  });
}

export async function apiMarkNotificationRead(id: string) {
  return apiFetch<any>(`/notifications/${id}/read`, {
    method: 'PUT',
  });
}

export async function apiMarkAllNotificationsRead() {
  return apiFetch<any>('/notifications/mark-all-read', {
    method: 'PUT',
  });
}
