import { Client } from '@notionhq/client';

const notion = new Client({
  auth: process.env.NOTION_TOKEN,
});

const DATABASE_ID = process.env.NOTION_DB_ID!;

export default async function handler(req: any, res: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    console.log('NOTION_TOKEN:', process.env.NOTION_TOKEN ? 'Set' : 'Not set');
    console.log('NOTION_DB_ID:', process.env.NOTION_DB_ID ? 'Set' : 'Not set');

    const {
      name,
      brand,
      category,
      quantity,
      completion,
      expiry,
      purchase_date,
      location,
      tags,
      notes,
      barcode,
      image
    } = req.body;

    // Process tags from comma-separated string to multi-select array
    const tagsArray = tags ? tags.split(',').map((tag: string) => tag.trim()).filter((tag: string) => tag) : [];

    const properties: any = { // eslint-disable-line @typescript-eslint/no-explicit-any
      'Name': {
        title: [
          {
            text: {
              content: name || 'Untitled Item'
            }
          }
        ]
      },
      'Brand': {
        rich_text: [
          {
            text: {
              content: brand || ''
            }
          }
        ]
      },
      'Category': {
        rich_text: [
          {
            text: {
              content: category || ''
            }
          }
        ]
      },
      'Quantity': {
        rich_text: [
          {
            text: {
              content: quantity ? quantity.toString() : ''
            }
          }
        ]
      },
      'Completion %': {
        number: completion ? parseFloat(completion) : null
      },
      'Expiry': {
        date: expiry ? { start: expiry } : null
      },
      'Purchase Date': {
        date: purchase_date ? { start: purchase_date } : null
      },
      'Location': location ? { select: { name: location } } : undefined,
      'Tags': {
        multi_select: tagsArray.map((tag: string) => ({ name: tag }))
      },
      'Notes': {
        rich_text: [
          {
            text: {
              content: notes || ''
            }
          }
        ]
      },
      'Barcode': {
        rich_text: [
          {
            text: {
              content: barcode || ''
            }
          }
        ]
      }
    };

    // Handle image - if it's a base64 data URL, store it as rich_text
    // If it's a URL, store it as files
    if (image) {
      if (image.startsWith('data:')) {
        // Base64 image - store as rich_text (data URL)
        properties['Product Image'] = {
          rich_text: [
            {
              text: {
                content: image
              }
            }
          ]
        };
      } else {
        // URL image - store as files
        properties['Product Image'] = {
          files: [
            {
              name: 'Product Image',
              type: 'external',
              external: {
                url: image
              }
            }
          ]
        };
      }
    }

    console.log('Creating Notion page with properties:', JSON.stringify(properties, null, 2));

    const response = await notion.pages.create({
      parent: {
        database_id: DATABASE_ID,
      },
      properties: properties,
    });

    console.log('Notion API response:', response);

    res.status(200).json({
      success: true,
      message: 'Successfully added to Notion',
      pageId: response.id
    });

  } catch (error: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
    console.error('Error adding to Notion:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add to Notion',
      error: error.message
    });
  }
}
