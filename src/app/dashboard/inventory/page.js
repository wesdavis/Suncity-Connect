'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Loader2, ArrowLeft, Plus, Trash2, FileText, UploadCloud, Tag, DollarSign, Database, Package, Save, FileSpreadsheet } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from 'next/link';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

export default function InventoryPage() {
  const [loading, setLoading] = useState(true);
  const [clientId, setClientId] = useState(null);
  const [inventory, setInventory] = useState([]);
  
  // Manual Entry State
  const [newItemName, setNewItemName] = useState('');
  const [newItemPrice, setNewItemPrice] = useState('');
  const [newItemStock, setNewItemStock] = useState('');
  const [adding, setAdding] = useState(false);
  
  // File Upload States
  const [scanning, setScanning] = useState(false);
  const [csvUploading, setCsvUploading] = useState(false);

  // Inline Edit State
  const [editingStock, setEditingStock] = useState({});
  const [savingStockId, setSavingStockId] = useState(null);

  useEffect(() => {
    fetchInventory();
  }, []);

  const fetchInventory = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const { data: clientData } = await supabase
      .from('clients')
      .select('id')
      .eq('user_id', session.user.id)
      .single();

    if (clientData) {
      setClientId(clientData.id);
      
      const { data: items } = await supabase
        .from('client_inventory')
        .select('*')
        .eq('client_id', clientData.id)
        .order('created_at', { ascending: false });
        
      if (items) setInventory(items);
    }
    setLoading(false);
  };

  // --- MANUAL ITEM ADDITION ---
  const handleManualAdd = async (e) => {
    e.preventDefault();
    if (!newItemName || !newItemPrice) return;
    setAdding(true);

    const priceNum = parseFloat(newItemPrice.replace('$', ''));
    const stockNum = newItemStock ? parseInt(newItemStock, 10) : 9999;

    const { data, error } = await supabase
      .from('client_inventory')
      .insert([{ 
        client_id: clientId, 
        item_name: newItemName, 
        price: priceNum,
        stock_count: stockNum 
      }])
      .select();

    if (!error && data) {
      setInventory([data[0], ...inventory]);
      setNewItemName('');
      setNewItemPrice('');
      setNewItemStock('');
    } else {
      alert("Failed to add item.");
    }
    setAdding(false);
  };

  // --- INLINE STOCK UPDATE ---
  const handleStockChange = (id, val) => {
    setEditingStock(prev => ({ ...prev, [id]: val }));
  };

  const saveUpdatedStock = async (id) => {
    const newValue = editingStock[id];
    if (newValue === undefined) return;
    
    setSavingStockId(id);
    const stockNum = parseInt(newValue, 10) || 0; // Default to 0 if NaN

    const { error } = await supabase
      .from('client_inventory')
      .update({ stock_count: stockNum })
      .eq('id', id);

    if (!error) {
      setInventory(inventory.map(item => item.id === id ? { ...item, stock_count: stockNum } : item));
    } else {
      alert("Failed to update stock.");
    }
    setSavingStockId(null);
  };

  const handleDelete = async (id) => {
    const { error } = await supabase
      .from('client_inventory')
      .delete()
      .eq('id', id);

    if (!error) {
      setInventory(inventory.filter(item => item.id !== id));
    }
  };

  // --- CSV BULK UPLOAD ENGINE ---
  const handleCsvUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    if (file.type !== "text/csv" && !file.name.endsWith('.csv')) {
      alert("Please upload a valid .csv file.");
      return;
    }

    setCsvUploading(true);
    const reader = new FileReader();
    
    reader.onload = async (event) => {
      const text = event.target.result;
      const rows = text.split('\n').map(row => row.trim()).filter(row => row);
      const dataToInsert = [];

      for (let i = 0; i < rows.length; i++) {
        // Skip the header row if it contains the word 'price' or 'name'
        if (i === 0 && rows[i].toLowerCase().includes('price')) continue;
        
        const cols = rows[i].split(',').map(col => col.trim());
        
        if (cols.length >= 2) {
          const name = cols[0];
          // Strip out $ signs and letters from price
          const price = parseFloat(cols[1].replace(/[^0-9.-]+/g,""));
          
          let stock = 9999;
          if (cols[2]) {
             stock = parseInt(cols[2].replace(/[^0-9]+/g,""), 10);
             if (isNaN(stock)) stock = 9999;
          }

          if (!isNaN(price) && name) {
            dataToInsert.push({
              client_id: clientId,
              item_name: name,
              price: price,
              stock_count: stock
            });
          }
        }
      }

      if (dataToInsert.length > 0) {
        const { error } = await supabase.from('client_inventory').insert(dataToInsert);
        if (!error) {
          alert(`Success! Imported ${dataToInsert.length} items from CSV.`);
          fetchInventory();
        } else {
          console.error("CSV Upload Error:", error);
          alert("Database error uploading CSV.");
        }
      } else {
        alert("No valid items found in the CSV. Make sure the format is: Name, Price, Stock");
      }
      setCsvUploading(false);
    };

    reader.readAsText(file);
    e.target.value = ''; // Reset input so same file can be uploaded again if needed
  };

  // --- PDF MENU UPLOAD ---
  const handlePdfMenuUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    if (file.type !== "application/pdf") {
      alert("Please upload a PDF menu.");
      return;
    }

    setScanning(true);
    const reader = new FileReader();
    reader.readAsDataURL(file);
    
    reader.onload = async () => {
      const base64String = reader.result.split(',')[1];
      
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        const res = await fetch('/api/upload-menu', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session?.access_token}`
          },
          body: JSON.stringify({
            fileBase64: base64String,
            clientId: clientId
          })
        });

        const data = await res.json();
        
        if (data.success) {
          alert(`Success! Imported ${data.itemsAdded} items from your menu.`);
          fetchInventory();
        } else {
          alert(`Extraction error: ${data.error}`);
        }
      } catch (err) {
        console.error("Menu upload crashed:", err);
        alert("Failed to connect to the AI menu scanner.");
      }
      setScanning(false);
      e.target.value = ''; 
    };
  };

  return (
    <div 
      className="min-h-screen p-4 md:p-8 pt-12 md:pt-24 font-sans selection:bg-orange-500/30 bg-zinc-950 bg-fixed bg-cover bg-center"
      style={{ backgroundImage: `linear-gradient(to bottom, rgba(9, 9, 11, 0.8), rgba(9, 9, 11, 0.95)), url('/assets/bg-dark.png')` }}
    >
      <div className="max-w-7xl mx-auto space-y-12">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-8 md:gap-10">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6 flex-1">
            <div className="p-4 bg-orange-500/10 border border-orange-500/30 rounded-2xl shrink-0">
                <Database className="text-orange-500 w-8 h-8" />
            </div>
            <div>
              <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-white mb-2">
                Digital Inventory
              </h1>
              <p className="text-zinc-400 text-sm md:text-lg max-w-2xl">
                Manage your product catalog and active stock counts. The AI will strictly reference this data when checking out customers.
              </p>
            </div>
          </div>
          
          <div className="flex shrink-0 mt-2 md:mt-0">
            <Link href="/dashboard">
              <Button variant="outline" className="w-full bg-zinc-900/50 border-white/10 text-white hover:bg-zinc-800 h-11 px-6">
                <ArrowLeft className="w-4 h-4 mr-2" /> Pipeline
              </Button>
            </Link>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="w-10 h-10 animate-spin text-orange-500" /></div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* Control Panel (Left Side) */}
            <div className="lg:col-span-4 space-y-6">
              
              {/* PDF Scanner Card */}
              <Card className="bg-zinc-950/60 backdrop-blur-2xl border-white/10 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500 to-blue-500"></div>
                <CardHeader className="pb-4">
                  <CardTitle className="text-white flex items-center gap-2 text-base">
                    <FileText className="w-5 h-5 text-purple-400" /> AI PDF Menu Scanner
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="relative border-2 border-dashed border-white/10 hover:border-purple-500/50 rounded-xl p-6 text-center transition-colors bg-zinc-900/30">
                    <input 
                      type="file" 
                      accept=".pdf"
                      disabled={scanning}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                      onChange={handlePdfMenuUpload}
                    />
                    <div className="flex flex-col items-center gap-3 pointer-events-none">
                      {scanning ? (
                        <>
                          <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
                          <span className="text-sm font-bold text-white">Extracting prices...</span>
                        </>
                      ) : (
                        <>
                          <UploadCloud className="w-8 h-8 text-zinc-500" />
                          <span className="text-sm font-bold text-white">Drop PDF menu here</span>
                        </>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* CSV Upload Card */}
              <Card className="bg-zinc-950/60 backdrop-blur-2xl border-white/10 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 to-green-500"></div>
                <CardHeader className="pb-4">
                  <CardTitle className="text-white flex items-center gap-2 text-base">
                    <FileSpreadsheet className="w-5 h-5 text-emerald-400" /> Bulk CSV Upload
                  </CardTitle>
                  <CardDescription className="text-zinc-400 text-xs">Format: Item Name, Price, Stock Count</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="relative border-2 border-dashed border-white/10 hover:border-emerald-500/50 rounded-xl p-6 text-center transition-colors bg-zinc-900/30">
                    <input 
                      type="file" 
                      accept=".csv"
                      disabled={csvUploading}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                      onChange={handleCsvUpload}
                    />
                    <div className="flex flex-col items-center gap-3 pointer-events-none">
                      {csvUploading ? (
                        <>
                          <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
                          <span className="text-sm font-bold text-white">Importing Data...</span>
                        </>
                      ) : (
                        <>
                          <UploadCloud className="w-8 h-8 text-zinc-500" />
                          <span className="text-sm font-bold text-white">Drop .CSV file here</span>
                        </>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Manual Add Card */}
              <Card className="bg-zinc-950/60 backdrop-blur-2xl border-white/10 shadow-2xl">
                <CardHeader>
                  <CardTitle className="text-white text-lg">Manual Entry</CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleManualAdd} className="space-y-4">
                    <div className="space-y-2">
                      <Label className="text-zinc-300">Item Name</Label>
                      <Input 
                        placeholder="e.g. Graphic Tee" 
                        required
                        className="bg-zinc-900/50 border-white/10 text-white"
                        value={newItemName}
                        onChange={(e) => setNewItemName(e.target.value)}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-zinc-300">Price</Label>
                        <Input 
                          type="number"
                          step="0.01"
                          placeholder="25.00" 
                          required
                          className="bg-zinc-900/50 border-white/10 text-white"
                          value={newItemPrice}
                          onChange={(e) => setNewItemPrice(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-zinc-300">Stock (Opt)</Label>
                        <Input 
                          type="number"
                          placeholder="∞" 
                          className="bg-zinc-900/50 border-white/10 text-white"
                          value={newItemStock}
                          onChange={(e) => setNewItemStock(e.target.value)}
                        />
                      </div>
                    </div>
                    <Button type="submit" disabled={adding} className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold transition-all mt-2">
                      {adding ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />}
                      Add to Inventory
                    </Button>
                  </form>
                </CardContent>
              </Card>

            </div>

            {/* Inventory List (Right Side) */}
            <div className="lg:col-span-8">
              <Card className="bg-zinc-950/60 backdrop-blur-2xl border-white/10 shadow-2xl h-full">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Package className="w-5 h-5 text-orange-400" /> Active Catalog
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {inventory.length === 0 ? (
                    <div className="text-center py-20 text-zinc-500">
                      <Database className="w-16 h-16 mx-auto mb-4 opacity-20" />
                      <p className="text-lg">Your inventory is empty.</p>
                      <p className="text-sm mt-2">Upload a file or add items manually to get started.</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {/* Column Headers */}
                      <div className="grid grid-cols-12 gap-4 px-4 py-2 text-xs font-bold text-zinc-500 uppercase tracking-wider hidden sm:grid">
                        <div className="col-span-5">Product</div>
                        <div className="col-span-2 text-center">Price</div>
                        <div className="col-span-4 text-center">Stock Count</div>
                        <div className="col-span-1"></div>
                      </div>

                      {inventory.map((item) => (
                        <div key={item.id} className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center p-4 bg-zinc-900/50 border border-white/5 rounded-xl hover:bg-zinc-900 transition-colors">
                          
                          <div className="sm:col-span-5 flex flex-col">
                            <span className="text-white font-bold truncate">{item.item_name}</span>
                          </div>
                          
                          <div className="sm:col-span-2 flex items-center sm:justify-center text-green-400 font-mono text-sm">
                            <DollarSign className="w-3 h-3 mr-0.5" />{item.price.toFixed(2)}
                          </div>
                          
                          {/* Inline Stock Editor */}
                          <div className="sm:col-span-4 flex items-center gap-2 sm:justify-center">
                            <Input 
                              type="number" 
                              className="w-24 h-8 bg-black/40 border-white/10 text-white text-center rounded-md"
                              value={editingStock[item.id] !== undefined ? editingStock[item.id] : (item.stock_count === 9999 ? '' : item.stock_count)}
                              placeholder="∞"
                              onChange={(e) => handleStockChange(item.id, e.target.value)}
                            />
                            {editingStock[item.id] !== undefined && editingStock[item.id] !== String(item.stock_count === 9999 ? '' : item.stock_count) && (
                              <Button 
                                size="sm" 
                                onClick={() => saveUpdatedStock(item.id)}
                                disabled={savingStockId === item.id}
                                className="h-8 w-8 p-0 bg-orange-500 hover:bg-orange-600 text-white"
                              >
                                {savingStockId === item.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                              </Button>
                            )}
                          </div>

                          <div className="sm:col-span-1 flex justify-end">
                            <Button 
                              variant="ghost" 
                              size="icon"
                              onClick={() => handleDelete(item.id)}
                              className="text-zinc-500 hover:text-red-400 hover:bg-red-400/10 h-8 w-8"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

          </div>
        )}
      </div>
    </div>
  );
}