import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  console.log('Shopping list API called:', req.method);
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_KEY!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  // Get user from auth header
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    console.log('No authorization header');
    return res.status(401).json({ error: 'No authorization header' });
  }

  const token = authHeader.replace('Bearer ', '');
  console.log('Token received, length:', token.length);
  console.log('Token starts with:', token.substring(0, 20) + '...');
  
  let user;
  try {
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError) {
      console.log('Auth error details:', authError);
      return res.status(401).json({ error: 'Invalid token', details: authError.message });
    }
    
    if (!authUser) {
      console.log('No user found in token');
      return res.status(401).json({ error: 'No user found in token' });
    }
    
    user = authUser;
  } catch (error) {
    console.log('Exception during auth:', error);
    return res.status(500).json({ error: 'Authentication failed', details: (error as Error).message });
  }

  console.log('User authenticated:', user.id);

  try {
    switch (req.method) {
      case 'GET':
        console.log('GET request - fetching shopping list');
        // Get shopping list items with pantry item details
        const { data: shoppingList, error: shoppingError } = await supabase
          .from('shopping_list')
          .select(`
            *,
            pantry_items (
              id,
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
              image,
              scanned_at
            )
          `)
          .order('added_at', { ascending: false });

        if (shoppingError) {
          console.log('Shopping list fetch error:', shoppingError);
          return res.status(500).json({ error: 'Failed to fetch shopping list' });
        }

        console.log('Shopping list fetched successfully, items:', shoppingList?.length || 0);

        // Transform data to match expected format
        const items = shoppingList.map(item => ({
          ...item.pantry_items,
          shopping_list_id: item.id,
          added_by: item.added_by,
          added_at: item.added_at
        }));

        return res.status(200).json(items);

      case 'POST':
        const { itemId } = req.body;
        console.log('POST request - adding item:', itemId);
        
        if (!itemId) {
          console.log('No itemId provided');
          return res.status(400).json({ error: 'Item ID is required' });
        }

        // Add item to shopping list
        const { data: newItem, error: insertError } = await supabase
          .from('shopping_list')
          .insert({
            item_id: itemId,
            added_by: user.id
          })
          .select()
          .single();

        if (insertError) {
          console.log('Insert error:', insertError);
          if (insertError.code === '23505') { // Unique constraint violation
            return res.status(409).json({ error: 'Item already in shopping list' });
          }
          return res.status(500).json({ error: 'Failed to add item to shopping list' });
        }

        console.log('Item added successfully:', newItem);
        return res.status(201).json(newItem);

      case 'DELETE':
        const { shoppingListId } = req.body;
        console.log('DELETE request - removing item:', shoppingListId);
        
        if (!shoppingListId) {
          console.log('No shoppingListId provided');
          return res.status(400).json({ error: 'Shopping list item ID is required' });
        }

        // Delete item from shopping list
        const { error: deleteError } = await supabase
          .from('shopping_list')
          .delete()
          .eq('id', shoppingListId);

        if (deleteError) {
          console.log('Delete error:', deleteError);
          return res.status(500).json({ error: 'Failed to remove item from shopping list' });
        }

        console.log('Item deleted successfully');
        return res.status(200).json({ message: 'Item removed from shopping list' });

      default:
        return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Shopping list API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
} 