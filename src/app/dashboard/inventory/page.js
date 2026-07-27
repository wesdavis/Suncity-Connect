'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Loader2, ArrowLeft, Plus, Trash2, FileText, UploadCloud, Tag, DollarSign, Database } from 'lucide-react';
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
  const [adding, setAdding] = useState(false);
  
  // PDF Scanner State
  const [scanning, setScanning] = useState(false);

  useEffect(() => {
    fetchInventory();
  }, []);

  const fetchInventory = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    // Get Client ID first
    const { data: clientData } = await supabase
      .from('clients')
      .select('id')
      .eq('user_id', session.user.id)
      .single();

    if (clientData) {
      setClientId(clientData.id);
      
      // Fetch their menu items
      const { data: items } = await supabase
        .from('client_inventory')
        .select('*')
        .eq('client_id', clientData.id)
        .order('created_at', { ascending: false });
        
      if (items) setInventory(items);
    }
    setLoading(false);
  };

  const handleManualAdd = async (e) => {
    e.preventDefault();
    if (!newItemName || !newItemPrice) return;
    setAdding(true);

    const priceNum = parseFloat(newItemPrice.replace('$', ''));

    const { data, error } = await supabase
      .from('client_inventory')
      .insert([{ 
        client_id: clientId, 
        item_name: newItemName, 
        price: priceNum 
      }])
      .select();

    if (!error && data) {
      setInventory([data[0], ...inventory]);
      setNewItemName('');
      setNewItemPrice('');
    } else {
      alert("Failed to add item.");
    }
    setAdding(false);
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
        
        // We will build this backend route next!
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
          fetchInventory(); // Refresh the list
        } else {
          alert(`Extraction error: ${data.error}`);
        }
      } catch (err) {
        console.error("Menu upload crashed:", err);
        alert("Failed to connect to the AI menu scanner.");
      }
      setScanning(false);
    };
  };

  return (
    <div 
      className="min-h-screen p-4 md:p-8 pt-12 md:pt-24 font-sans selection:bg-orange-500/30 bg-zinc-950 bg-fixed bg-cover bg-center"
      style={{ backgroundImage: `linear-gradient(to bottom, rgba(9, 9, 11, 0.8), rgba(9, 9, 11, 0.95)), url('/assets/bg-dark.png')` }}
    >
      <div className="max-w-6xl mx-auto space-y-12">
        
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
              <p className="text-zinc-400 text-sm md:text-lg max-w-xl">
                Upload your menu or price sheet. The AI will strictly reference these prices when checking out customers.
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
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Control Panel (Left Side) */}
            <div className="space-y-6">
              
              {/* PDF Scanner Card */}
              <Card className="bg-zinc-950/60 backdrop-blur-2xl border-white/10 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500 to-blue-500"></div>
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <FileText className="w-5 h-5 text-purple-400" /> AI Menu Scanner
                  </CardTitle>
                  <CardDescription className="text-zinc-400">Upload a PDF menu and the AI will automatically extract all items and prices for you.</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="relative border-2 border-dashed border-white/10 hover:border-purple-500/50 rounded-xl p-8 text-center transition-colors bg-zinc-900/30">
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
                          <Loader2 className="w-10 h-10 text-purple-500 animate-spin" />
                          <span className="text-sm font-bold text-white">Extracting prices...</span>
                        </>
                      ) : (
                        <>
                          <UploadCloud className="w-10 h-10 text-zinc-500" />
                          <span className="text-sm font-bold text-white">Click or drag PDF here</span>
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
                        placeholder="e.g. Asada Tacos (3)" 
                        className="bg-zinc-900/50 border-white/10 text-white"
                        value={newItemName}
                        onChange={(e) => setNewItemName(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-zinc-300">Price</Label>
                      <Input 
                        type="number"
                        step="0.01"
                        placeholder="12.50" 
                        className="bg-zinc-900/50 border-white/10 text-white"
                        value={newItemPrice}
                        onChange={(e) => setNewItemPrice(e.target.value)}
                      />
                    </div>
                    <Button type="submit" disabled={adding} className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold transition-all">
                      {adding ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />}
                      Add to Inventory
                    </Button>
                  </form>
                </CardContent>
              </Card>

            </div>

            {/* Inventory List (Right Side) */}
            <div className="lg:col-span-2">
              <Card className="bg-zinc-950/60 backdrop-blur-2xl border-white/10 shadow-2xl h-full">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Tag className="w-5 h-5 text-green-400" /> Active Menu Items
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {inventory.length === 0 ? (
                    <div className="text-center py-12 text-zinc-500">
                      <Database className="w-12 h-12 mx-auto mb-3 opacity-20" />
                      <p>Your inventory is empty.</p>
                      <p className="text-sm">Upload a PDF or add items manually to get started.</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {inventory.map((item) => (
                        <div key={item.id} className="flex items-center justify-between p-4 bg-zinc-900/50 border border-white/5 rounded-xl hover:bg-zinc-900 transition-colors">
                          <div className="flex flex-col">
                            <span className="text-white font-bold">{item.item_name}</span>
                            <span className="text-green-400 font-mono text-sm flex items-center mt-1">
                              <DollarSign className="w-3 h-3 mr-0.5" />{item.price.toFixed(2)}
                            </span>
                          </div>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => handleDelete(item.id)}
                            className="text-zinc-500 hover:text-red-400 hover:bg-red-400/10"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
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