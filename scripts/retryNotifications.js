const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function processQueue() {
  try {
    console.log('🔔 Processing notification queue...');
    
    const items = await prisma.notificationQueue.findMany({
      where: { 
        tries: { lt: 5 } 
      },
      orderBy: { createdAt: 'asc' },
      take: 20
    });

    console.log(`📨 Found ${items.length} notifications to process`);

    for (const item of items) {
      try {
        const payload = JSON.parse(item.payload);
        const token = process.env.TELEGRAM_BOT_TOKEN;
        
        if (!token) {
          console.error('❌ TELEGRAM_BOT_TOKEN not configured');
          continue;
        }

        const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        if (response.ok) {
          console.log(`✅ Successfully sent notification ${item.id}`);
          await prisma.notificationQueue.delete({ 
            where: { id: item.id } 
          });
        } else {
          const errorText = await response.text();
          console.error(`❌ Failed to send notification ${item.id}:`, errorText);
          
          await prisma.notificationQueue.update({
            where: { id: item.id },
            data: { 
              tries: item.tries + 1,
              error: errorText.substring(0, 500), // Limit error length
              lastTried: new Date()
            }
          });
        }
      } catch (error) {
        console.error(`❌ Error processing notification ${item.id}:`, error.message);
        
        await prisma.notificationQueue.update({
          where: { id: item.id },
          data: { 
            tries: item.tries + 1,
            error: error.message,
            lastTried: new Date()
          }
        });
      }

      // Small delay between processing to avoid rate limits
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  } catch (error) {
    console.error('❌ Queue processing error:', error);
  }
}

async function main() {
  console.log('🔄 Starting notification retry service...');
  
  // Process immediately on start
  await processQueue();
  
  // Then process every 30 seconds
  setInterval(processQueue, 30 * 1000);
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log('🛑 Shutting down notification service...');
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('🛑 Shutting down notification service...');
  await prisma.$disconnect();
  process.exit(0);
});

main().catch(console.error);
