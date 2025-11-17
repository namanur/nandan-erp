import { prisma } from '../lib/prisma';

export async function sendTelegramNotification(message) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!token || !chatId) {
    console.warn('Telegram credentials not configured');
    return null;
  }

  const payload = { 
    chat_id: chatId, 
    text: message, 
    parse_mode: 'HTML' 
  };

  async function sendOnce() {
    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    
    if (!res.ok) {
      const body = await res.text();
      const err = new Error(`Telegram API error: ${res.status} ${body}`);
      err.status = res.status;
      throw err;
    }
    
    return await res.json();
  }

  try {
    return await sendOnce();
  } catch (err) {
    // retry once after 700ms
    console.warn('Telegram send failed, retrying once:', err.message);
    await new Promise(r => setTimeout(r, 700));
    
    try {
      return await sendOnce();
    } catch (err2) {
      console.error('Telegram send retry failed:', err2.message);
      
      // Save to notification queue for later processing
      try {
        await prisma.notificationQueue.create({ 
          data: { 
            payload: JSON.stringify(payload), 
            error: err2.message,
            lastTried: new Date()
          }
        });
        console.log('📨 Notification saved to queue for retry');
      } catch (dbError) {
        console.error('Failed to save notification to queue:', dbError);
      }
      
      return null;
    }
  }
}

export function formatOrderNotification(order, customer, items, source) {
  const itemsText = items.map(item => 
    `• ${item.product.title} (x${item.quantity}) - ₹${(item.price * item.quantity).toFixed(2)}`
  ).join('\n');

  const total = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  
  const time = new Date(order.createdAt).toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
    dateStyle: 'short',
    timeStyle: 'short'
  });

  return `
🛒 <b>New ${source} Order #${order.id}</b>

👤 <b>Customer:</b> ${customer.name}
📞 <b>Phone:</b> ${customer.phone}
${customer.notes ? `📝 <b>Notes:</b> ${customer.notes}\n` : ''}
📦 <b>Items:</b>
${itemsText}

💰 <b>Total:</b> ₹${total.toFixed(2)}
⏰ <b>Time:</b> ${time}
  `.trim();
}

export function formatLowStockNotification(product) {
  return `
⚠️ <b>LOW STOCK ALERT</b>

📦 <b>Product:</b> ${product.title}
📊 <b>Remaining Stock:</b> ${product.stock}
🆔 <b>SKU:</b> ${product.sku || 'N/A'}
🏷️ <b>Category:</b> ${product.category || 'Uncategorized'}
  `.trim();
}
