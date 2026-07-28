import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';
import crypto from 'crypto';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Initialize Stripe using your platform's master Secret Key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    try {
        const { clientId, items } = req.body;
        // Expected items array format: [{ name: "Midnight Stout", quantity: 2 }]

        if (!clientId || !items || items.length === 0) {
            return res.status(400).json({ error: 'Missing clientId or items' });
        }

        // 1. Fetch the Client's Payment Credentials
        const { data: client, error: clientError } = await supabase
            .from('clients')
            .select('payment_processor, stripe_account_id, square_access_token, square_location_id')
            .eq('id', clientId)
            .single();

        if (clientError || !client) throw new Error("Client not found");

        // 2. Fetch the Real Inventory (The Source of Truth)
        const { data: inventory, error: invError } = await supabase
            .from('client_inventory')
            .select('item_name, price, stock_count') // 🚨 ADDED stock_count
            .eq('client_id', clientId);

        if (invError) throw invError;

        // 3. Build the secure order payload by cross-referencing the database
        let orderTotal = 0;
        const secureLineItems = [];

        for (const requestedItem of items) {
            // Find the exact item in the database (case insensitive match)
            const dbItem = inventory.find(i => i.item_name.toLowerCase() === requestedItem.name.toLowerCase());
            
            if (!dbItem) {
                return res.status(400).json({ error: `Item not found in verified menu: ${requestedItem.name}` });
            }

            // Establish requested quantity
            const requestedQty = requestedItem.quantity || 1;

            // 🚨 NEW: THE INVENTORY HARD BLOCK 🚨
            // If stock is tracked (not null) and they ask for more than we have
            if (dbItem.stock_count !== null && requestedQty > dbItem.stock_count) {
                // This exact error string is caught by your AI and relayed to the customer!
                return res.status(400).json({ 
                    error: `Sorry, not enough stock! We only have ${dbItem.stock_count} of ${dbItem.item_name} left!` 
                });
            }

            secureLineItems.push({
                name: dbItem.item_name,
                price: dbItem.price,
                quantity: requestedQty
            });
            orderTotal += (dbItem.price * requestedQty);
        }

        let checkoutUrl = '';

        // 4. Generate the Stripe Link
        if (client.payment_processor === 'stripe') {
            if (!client.stripe_account_id) throw new Error("Stripe Account ID is missing");

            const stripeLineItems = secureLineItems.map(item => ({
                price_data: {
                    currency: 'usd',
                    product_data: { name: item.name },
                    unit_amount: Math.round(item.price * 100), // Stripe expects cents
                },
                quantity: item.quantity,
            }));

            // Create a readable string of the items for the webhook notification
            const orderSummary = secureLineItems.map(item => `${item.quantity}x ${item.name}`).join(', ');

            const session = await stripe.checkout.sessions.create({
                payment_method_types: ['card', 'cashapp'],
                line_items: stripeLineItems,
                mode: 'payment',
                success_url: `https://suncityconnect.com/success`, 
                // 🚨 INJECTING THE OMNI-CHANNEL METADATA 🚨
                metadata: {
                    order_type: 'product_order',
                    client_id: clientId,
                    // Truncate to 500 characters to strictly respect Stripe's API limits
                    items: orderSummary.substring(0, 500),
                    fulfillment: 'Standard'
                }
            }, {
                // This routes the payment directly to the client's connected Stripe account
                stripeAccount: client.stripe_account_id 
            });

            checkoutUrl = session.url;
        }
        
        // 5. Generate the Square Link
        else if (client.payment_processor === 'square') {
            if (!client.square_access_token || !client.square_location_id) {
                throw new Error("Square credentials missing");
            }

            const squareLineItems = secureLineItems.map(item => ({
                name: item.name,
                quantity: item.quantity.toString(),
                base_price_money: {
                    amount: Math.round(item.price * 100), // Square expects cents
                    currency: 'USD'
                }
            }));

            // Square requires a unique idempotency key for every request to prevent duplicate charges
            const idempotencyKey = crypto.randomUUID();

            // Hit the Square REST API
            const squareRes = await fetch('https://connect.squareup.com/v2/online-checkout/payment-links', {
    method: 'POST',
    headers: {
        'Square-Version': '2026-07-15', // Updated to the most recent stable API version
        'Authorization': `Bearer ${client.square_access_token}`,
        'Content-Type': 'application/json'
    },
                body: JSON.stringify({
                    idempotency_key: idempotencyKey,
                    order: {
                        location_id: client.square_location_id,
                        line_items: squareLineItems
                    }
                })
            });

            const squareData = await squareRes.json();
            
            if (squareData.errors) {
                console.error("Square API Error:", squareData.errors);
                throw new Error(squareData.errors[0].detail);
            }

            checkoutUrl = squareData.payment_link.url;
        }

        return res.status(200).json({ 
            success: true, 
            url: checkoutUrl,
            total: orderTotal 
        });

    } catch (error) {
        console.error("Checkout Engine Error:", error);
        return res.status(500).json({ error: error.message || "Failed to generate checkout link" });
    }
}