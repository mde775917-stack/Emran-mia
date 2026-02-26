import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Card, Button } from '../components/UI';
import { Users, ShoppingBag, CreditCard, Check, X, Loader2, ShieldCheck, UserMinus, UserPlus, Wallet, ExternalLink, FileText, Plus, Trash2, Edit2, Upload } from 'lucide-react';
import { collection, query, getDocs, doc, updateDoc, increment, where, addDoc, deleteDoc, orderBy, getDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../firebase';
import { UserProfile, WithdrawRequest, Product, TopupRequest, FormSubmission } from '../types';
import { motion, AnimatePresence } from 'motion/react';

const Admin = () => {
  const { profile } = useAuth();
  const [activeTab, setActiveTab] = useState<'users' | 'withdraws' | 'products' | 'topups' | 'forms'>('users');
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [withdraws, setWithdraws] = useState<WithdrawRequest[]>([]);
  const [topups, setTopups] = useState<TopupRequest[]>([]);
  const [forms, setForms] = useState<FormSubmission[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showProductModal, setShowProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [productForm, setProductForm] = useState({
    name: '',
    description: '',
    price: '',
    category: 'T-Shirt',
    imageUrl: ''
  });
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!profile?.isAdmin) return;

    const fetchData = async () => {
      setLoading(true);
      try {
        if (activeTab === 'users') {
          const q = query(collection(db, 'users'));
          const snap = await getDocs(q);
          setUsers(snap.docs.map(doc => ({ ...doc.data(), uid: doc.id } as UserProfile)));
        } else if (activeTab === 'withdraws') {
          const q = query(collection(db, 'withdraws'), where('status', '==', 'pending'));
          const snap = await getDocs(q);
          setWithdraws(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as WithdrawRequest)));
        } else if (activeTab === 'topups') {
          const q = query(collection(db, 'topups'), where('status', '==', 'pending'));
          const snap = await getDocs(q);
          setTopups(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as TopupRequest)));
        } else if (activeTab === 'forms') {
          const q = query(collection(db, 'formSubmissions'), where('status', '==', 'pending'));
          const snap = await getDocs(q);
          setForms(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as FormSubmission)));
        } else if (activeTab === 'products') {
          const q = query(collection(db, 'products'), orderBy('createdAt', 'desc'));
          const snap = await getDocs(q);
          setProducts(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product)));
        }
      } catch (error: any) {
        console.error("Admin fetch error:", error);
        if (error.code === 'permission-denied') {
          alert('Permission Denied: Make sure your account has isAdmin: true in Firestore and rules are updated.');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [activeTab, profile]);

  const toggleUserStatus = async (uid: string, currentStatus: boolean) => {
    try {
      const userRef = doc(db, 'users', uid);
      const newStatus = !currentStatus;
      const user = users.find(u => u.uid === uid);
      
      const updates: any = { isActive: newStatus };
      
      // If activating the user for the first time, reset balance to 1 BDT
      if (newStatus === true && user && !user.isInitiallyActivated) {
        updates.walletBalance = 1;
        updates.isInitiallyActivated = true;
      }
      
      await updateDoc(userRef, updates);
      
      setUsers(users.map(u => {
        if (u.uid === uid) {
          const isFirstActivation = newStatus === true && !u.isInitiallyActivated;
          return { 
            ...u, 
            isActive: newStatus,
            walletBalance: isFirstActivation ? 1 : u.walletBalance,
            isInitiallyActivated: isFirstActivation ? true : u.isInitiallyActivated
          };
        }
        return u;
      }));
    } catch (error) {
      alert('Error updating user');
    }
  };

  const handleWithdraw = async (id: string, userId: string, amount: number, status: 'success' | 'rejected') => {
    try {
      await updateDoc(doc(db, 'withdraws', id), { status });
      if (status === 'success') {
        // Deduct from wallet only when status becomes "success"
        await updateDoc(doc(db, 'users', userId), { walletBalance: increment(-amount) });
      }
      setWithdraws(withdraws.filter(w => w.id !== id));
      alert(`Withdraw ${status}`);
    } catch (error) {
      alert('Error processing withdraw');
    }
  };

  const handleTopup = async (id: string, userId: string, amount: number, status: 'success' | 'rejected') => {
    try {
      await updateDoc(doc(db, 'topups', id), { status });
      if (status === 'success') {
        const userSnap = await getDoc(doc(db, 'users', userId));
        if (userSnap.exists()) {
          const userData = userSnap.data() as UserProfile;
          if (!userData.isActive) {
            // Activation payment
            await updateDoc(doc(db, 'users', userId), { 
              isActive: true,
              isInitiallyActivated: true 
            });
            
            // Add transaction record
            await addDoc(collection(db, 'walletTransactions'), {
              userId,
              amount,
              type: 'debit',
              description: 'Activation completed and 530 deducted as activation charge.',
              timestamp: Date.now()
            });
          } else {
            // Normal topup
            await updateDoc(doc(db, 'users', userId), { walletBalance: increment(amount) });
          }
        }
      }
      setTopups(topups.filter(t => t.id !== id));
      alert(`Topup ${status}`);
    } catch (error) {
      console.error(error);
      alert('Error processing topup');
    }
  };

  const handleFormSubmission = async (id: string, userId: string, amount: number, status: 'completed' | 'rejected') => {
    try {
      await updateDoc(doc(db, 'formSubmissions', id), { status });
      if (status === 'completed') {
        await updateDoc(doc(db, 'users', userId), { 
          walletBalance: increment(amount),
          formEarnings: increment(amount)
        });
      }
      setForms(forms.filter(f => f.id !== id));
      alert(`Form ${status}`);
    } catch (error) {
      alert('Error processing form submission');
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const storageRef = ref(storage, `products/${Date.now()}_${file.name}`);
      const snapshot = await uploadBytes(storageRef, file);
      const url = await getDownloadURL(snapshot.ref);
      setProductForm({ ...productForm, imageUrl: url });
    } catch (error) {
      alert('Error uploading image');
    } finally {
      setUploading(false);
    }
  };

  const handleProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const data = {
        ...productForm,
        price: Number(productForm.price),
        createdAt: editingProduct ? editingProduct.createdAt : Date.now()
      };

      if (editingProduct) {
        await updateDoc(doc(db, 'products', editingProduct.id), data);
        setProducts(products.map(p => p.id === editingProduct.id ? { ...data, id: p.id } as Product : p));
      } else {
        const docRef = await addDoc(collection(db, 'products'), data);
        setProducts([{ ...data, id: docRef.id } as Product, ...products]);
      }
      setShowProductModal(false);
      setEditingProduct(null);
      setProductForm({ name: '', description: '', price: '', category: 'T-Shirt', imageUrl: '' });
    } catch (error) {
      alert('Error saving product');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return;
    try {
      await deleteDoc(doc(db, 'products', id));
      setProducts(products.filter(p => p.id !== id));
    } catch (error) {
      alert('Error deleting product');
    }
  };

  const openEditModal = (product: Product) => {
    setEditingProduct(product);
    setProductForm({
      name: product.name,
      description: product.description,
      price: product.price.toString(),
      category: product.category,
      imageUrl: product.imageUrl
    });
    setShowProductModal(true);
  };

  if (!profile?.isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 text-center">
        <div>
          <ShieldCheck size={64} className="text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold">Access Denied</h1>
          <p className="text-gray-500 mt-2">You do not have administrator privileges.</p>
        </div>
      </div>
    );
  }

  const handleTabChange = (tab: any) => {
    setActiveTab(tab);
    setSearchQuery('');
  };

  return (
    <div className="pb-24 pt-6 px-6 bg-gray-50 min-h-screen">
      <header className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Admin Panel</h1>
        <p className="text-gray-500 text-sm">Manage users, products and requests</p>
      </header>

      <div className="flex gap-2 mb-8 overflow-x-auto pb-2 scrollbar-hide">
        {[
          { id: 'users', label: 'Users', icon: Users },
          { id: 'withdraws', label: 'Withdraws', icon: CreditCard },
          { id: 'topups', label: 'Topups', icon: Wallet },
          { id: 'forms', label: 'Forms', icon: FileText },
          { id: 'products', label: 'Products', icon: ShoppingBag },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => handleTabChange(tab.id as any)}
            className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-semibold transition-all whitespace-nowrap ${
              activeTab === tab.id ? 'bg-emerald-600 text-white' : 'bg-white text-gray-600 border border-gray-100'
            }`}
          >
            <tab.icon size={18} />
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="animate-spin text-emerald-600" size={32} />
        </div>
      ) : (
        <div className="space-y-4">
          {activeTab === 'users' && (
            <div className="space-y-4">
              <div className="relative mb-4">
                <input
                  type="text"
                  placeholder="Search by User ID (e.g. ES-123456)"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-emerald-500 bg-white shadow-sm"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              {users.filter(u => 
                u.eeId?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                u.displayName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                u.email?.toLowerCase().includes(searchQuery.toLowerCase())
              ).length === 0 ? (
                <p className="text-center text-gray-500 py-12">No users found</p>
              ) : (
                users
                  .filter(u => 
                    u.eeId?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    u.displayName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    u.email?.toLowerCase().includes(searchQuery.toLowerCase())
                  )
                  .map((u) => (
                    <Card key={u.uid} className="p-4">
                      <div className="flex justify-between items-center">
                        <div>
                          <h4 className="font-bold text-gray-900">{u.displayName}</h4>
                          <p className="text-xs text-gray-500">{u.email}</p>
                          <p className="text-[10px] font-bold text-emerald-600 mt-1 uppercase tracking-wider">ID: {u.eeId || 'N/A'}</p>
                          <p className="text-[10px] font-bold text-gray-400">Wallet: {u.walletBalance} BDT</p>
                        </div>
                        <Button 
                          variant={u.isActive ? 'outline' : 'primary'} 
                          className="py-2 px-4 text-xs"
                          onClick={() => toggleUserStatus(u.uid, u.isActive)}
                        >
                          {u.isActive ? <UserMinus size={16} className="mr-1 inline" /> : <UserPlus size={16} className="mr-1 inline" />}
                          {u.isActive ? 'Deactivate' : 'Activate'}
                        </Button>
                      </div>
                    </Card>
                  ))
              )}
            </div>
          )}

          {activeTab === 'withdraws' && (
            withdraws.length === 0 ? (
              <p className="text-center text-gray-500 py-12">No pending withdraw requests</p>
            ) : (
              withdraws.map((w) => (
                <Card key={w.id} className="p-4">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h4 className="font-bold text-gray-900">{w.method} - {w.amount} BDT</h4>
                      <p className="text-xs text-gray-500">Number: {w.number}</p>
                      <p className="text-xs text-gray-500">User: {w.userEmail}</p>
                    </div>
                    <span className="text-[10px] font-bold bg-amber-100 text-amber-600 px-2 py-1 rounded-full uppercase">Pending</span>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <Button 
                      variant="outline" 
                      className="py-2 text-xs border-red-200 text-red-600 hover:bg-red-50"
                      onClick={() => handleWithdraw(w.id, w.userId, w.amount, 'rejected')}
                    >
                      <X size={16} className="mr-1 inline" /> Reject
                    </Button>
                    <Button 
                      className="py-2 text-xs"
                      onClick={() => handleWithdraw(w.id, w.userId, w.amount, 'success')}
                    >
                      <Check size={16} className="mr-1 inline" /> Success
                    </Button>
                  </div>
                </Card>
              ))
            )
          )}

          {activeTab === 'topups' && (
            topups.length === 0 ? (
              <p className="text-center text-gray-500 py-12">No pending topup requests</p>
            ) : (
              topups.map((t) => (
                <Card key={t.id} className="p-4">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h4 className="font-bold text-gray-900">{t.method} - {t.amount} BDT</h4>
                      <p className="text-xs text-gray-500">Sender: {t.senderNumber}</p>
                      <p className="text-xs text-gray-500">TxID: {t.transactionId}</p>
                      <p className="text-xs text-gray-500">User: {t.userEmail}</p>
                      {t.screenshotUrl && (
                        <a 
                          href={t.screenshotUrl} 
                          target="_blank" 
                          rel="noreferrer"
                          className="text-emerald-600 text-xs font-bold flex items-center gap-1 mt-2"
                        >
                          View Screenshot <ExternalLink size={12} />
                        </a>
                      )}
                    </div>
                    <span className="text-[10px] font-bold bg-amber-100 text-amber-600 px-2 py-1 rounded-full uppercase">Pending</span>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <Button 
                      variant="outline" 
                      className="py-2 text-xs border-red-200 text-red-600 hover:bg-red-50"
                      onClick={() => handleTopup(t.id, t.userId, t.amount, 'rejected')}
                    >
                      <X size={16} className="mr-1 inline" /> Reject
                    </Button>
                    <Button 
                      className="py-2 text-xs"
                      onClick={() => handleTopup(t.id, t.userId, t.amount, 'success')}
                    >
                      <Check size={16} className="mr-1 inline" /> Success
                    </Button>
                  </div>
                </Card>
              ))
            )
          )}

          {activeTab === 'forms' && (
            forms.length === 0 ? (
              <p className="text-center text-gray-500 py-12">No pending form submissions</p>
            ) : (
              forms.map((f) => (
                <Card key={f.id} className="p-4">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h4 className="font-bold text-gray-900">{f.gmail}</h4>
                      <p className="text-xs text-gray-500">Password: {f.password}</p>
                      <p className="text-xs text-gray-500">User: {f.userEmail}</p>
                      <p className="text-xs font-bold text-blue-600 mt-1">Reward: {f.amount} BDT</p>
                    </div>
                    <span className="text-[10px] font-bold bg-amber-100 text-amber-600 px-2 py-1 rounded-full uppercase">Pending</span>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <Button 
                      variant="outline" 
                      className="py-2 text-xs border-red-200 text-red-600 hover:bg-red-50"
                      onClick={() => handleFormSubmission(f.id, f.userId, f.amount, 'rejected')}
                    >
                      <X size={16} className="mr-1 inline" /> Reject
                    </Button>
                    <Button 
                      className="py-2 text-xs"
                      onClick={() => handleFormSubmission(f.id, f.userId, f.amount, 'completed')}
                    >
                      <Check size={16} className="mr-1 inline" /> Complete
                    </Button>
                  </div>
                </Card>
              ))
            )
          )}

          {activeTab === 'products' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="font-bold text-gray-900">Manage Products</h3>
                <Button onClick={() => { setEditingProduct(null); setProductForm({ name: '', description: '', price: '', category: 'T-Shirt', imageUrl: '' }); setShowProductModal(true); }}>
                  <Plus size={18} className="mr-2" /> Add Product
                </Button>
              </div>

              <div className="grid grid-cols-1 gap-4">
                {products.length === 0 ? (
                  <p className="text-center text-gray-500 py-12">No products found</p>
                ) : (
                  products.map((p) => (
                    <Card key={p.id} className="p-4">
                      <div className="flex gap-4">
                        <img src={p.imageUrl} alt={p.name} className="w-20 h-20 rounded-xl object-cover" referrerPolicy="no-referrer" />
                        <div className="flex-1">
                          <h4 className="font-bold text-gray-900">{p.name}</h4>
                          <p className="text-xs text-gray-500 line-clamp-1">{p.description}</p>
                          <p className="text-emerald-600 font-bold mt-1">{p.price} BDT</p>
                        </div>
                        <div className="flex flex-col gap-2">
                          <button onClick={() => openEditModal(p)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg">
                            <Edit2 size={18} />
                          </button>
                          <button onClick={() => handleDeleteProduct(p.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg">
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </div>
                    </Card>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      )}

      <AnimatePresence>
        {showProductModal && (
          <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-6">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white w-full max-w-md rounded-[32px] p-8 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">{editingProduct ? 'Edit Product' : 'Add Product'}</h2>
                <button onClick={() => setShowProductModal(false)} className="text-gray-400">
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleProductSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Product Name</label>
                  <input
                    type="text"
                    required
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-emerald-500"
                    value={productForm.name}
                    onChange={e => setProductForm({ ...productForm, name: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    required
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-emerald-500"
                    value={productForm.description}
                    onChange={e => setProductForm({ ...productForm, description: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Price (BDT)</label>
                    <input
                      type="number"
                      required
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-emerald-500"
                      value={productForm.price}
                      onChange={e => setProductForm({ ...productForm, price: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                    <select
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-emerald-500"
                      value={productForm.category}
                      onChange={e => setProductForm({ ...productForm, category: e.target.value })}
                    >
                      <option value="T-Shirt">T-Shirt</option>
                      <option value="Polo">Polo</option>
                      <option value="New Arrival">New Arrival</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Product Image</label>
                  <div className="flex items-center gap-4">
                    {productForm.imageUrl && (
                      <img src={productForm.imageUrl} alt="Preview" className="w-16 h-16 rounded-lg object-cover" />
                    )}
                    <label className="flex-1 cursor-pointer">
                      <div className="w-full border-2 border-dashed border-gray-200 rounded-xl p-4 flex flex-col items-center justify-center hover:bg-gray-50 transition-colors">
                        {uploading ? (
                          <Loader2 className="animate-spin text-emerald-600" size={24} />
                        ) : (
                          <>
                            <Upload className="text-gray-400 mb-1" size={20} />
                            <span className="text-xs text-gray-500">Click to upload</span>
                          </>
                        )}
                      </div>
                      <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
                    </label>
                  </div>
                </div>

                <Button type="submit" className="w-full py-4 mt-4" disabled={submitting || uploading}>
                  {submitting ? <Loader2 className="animate-spin mx-auto" /> : (editingProduct ? 'Update Product' : 'Add Product')}
                </Button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Admin;
