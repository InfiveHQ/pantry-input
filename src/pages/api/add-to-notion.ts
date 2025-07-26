import { NextApiRequest, NextApiResponse } from 'next';
import { Client } from '@notionhq/client';

const notion = new Client({
  auth: process.env.NOTION_TOKEN,
});

const DATABASE_ID = process.env.NOTION_DB_ID;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  // Debug: Log environment variables
  console.log('NOTION_TOKEN exists:', !!process.env.NOTION_TOKEN);
  console.log('NOTION_DB_ID exists:', !!process.env.NOTION_DB_ID);
  console.log('DATABASE_ID:', DATABASE_ID);

  try {
    const {
      name,
      brand,
      category,
      quantity,
      completion,
      expiry,
      purchase_date,
      scanned_at,
      barcode,
      location,
      tags,
      notes,
      image
    } = req.body;

    console.log('Creating Notion page with data:', { name, brand, category });

    const response = await notion.pages.create({
      parent: {
        database_id: DATABASE_ID!,
      },
      properties: {
        Name: {
          title: [
            {
              text: {
                content: name || 'Unknown Product',
              },
            },
          ],
        },
        Brand: {
          rich_text: [
            {
              text: {
                content: brand || '',
              },
            },
          ],
        },
        Category: {
          rich_text: [
            {
              text: {
                content: category || '',
              },
            },
          ],
        },
        Quantity: {
          rich_text: [
            {
              text: {
                content: quantity?.toString() || '0',
              },
            },
          ],
        },
        'Completion %': {
          number: completion || 100,
        },
        Expiry: {
          date: expiry ? { start: expiry } : null,
        },
        'Purchase Date': {
          date: purchase_date ? { start: purchase_date } : null,
        },
        'Scanned At': {
          date: scanned_at ? { start: scanned_at } : null,
        },
        Barcode: {
          rich_text: [
            {
              text: {
                content: barcode || '',
              },
            },
          ],
        },
        Location: {
          select: {
            name: location || 'Unknown',
          },
        },
        Tags: {
          multi_select: tags ? tags.split(',').map((tag: string) => ({ name: tag.trim() })) : [],
        },
        Notes: {
          rich_text: [
            {
              text: {
                content: notes || '',
              },
            },
          ],
        },
        'Product Image': {
          files: image ? [
            {
              name: 'Product Image',
              type: 'external',
              external: {
                url: image,
              },
            },
          ] : [],
        },
      },
    });

    console.log('Notion page created successfully:', response.id);

    res.status(200).json({ 
      success: true, 
      notionPageId: response.id,
      message: 'Added to Notion successfully' 
    });
  } catch (error) {
    console.error('Notion API error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to add to Notion',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
