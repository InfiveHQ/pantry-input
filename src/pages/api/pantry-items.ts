import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    // Get pantry items for a household
    const { household_id } = req.query;
    
    if (!household_id) {
      return res.status(400).json({ error: 'Household ID is required' });
    }

    try {
      const { data: items, error } = await supabase
        .from('pantry_items')
        .select(`
          *,
          profiles:created_by(email, full_name)
        `)
        .eq('household_id', household_id)
        .order('scanned_at', { ascending: false });

      if (error) throw error;

      res.status(200).json(items);
    } catch (error) {
      console.error('Error fetching pantry items:', error);
      res.status(500).json({ error: 'Failed to fetch pantry items' });
    }
  } else if (req.method === 'POST') {
    // Add new pantry item
    const { 
      household_id, 
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
      created_by 
    } = req.body;

    if (!household_id || !name || !created_by) {
      return res.status(400).json({ error: 'Household ID, name, and created_by are required' });
    }

    try {
      // Verify user is a member of the household
      const { data: membership, error: membershipError } = await supabase
        .from('household_members')
        .select('*')
        .eq('household_id', household_id)
        .eq('user_id', created_by)
        .single();

      if (membershipError || !membership) {
        return res.status(403).json({ error: 'User is not a member of this household' });
      }

      // Insert pantry item
      const { data: item, error: insertError } = await supabase
        .from('pantry_items')
        .insert({
          household_id,
          name,
          brand,
          category,
          quantity: quantity || 1,
          completion: completion || 100,
          expiry,
          purchase_date,
          location,
          tags,
          notes,
          barcode,
          image,
          created_by
        })
        .select()
        .single();

      if (insertError) throw insertError;

      res.status(201).json(item);
    } catch (error) {
      console.error('Error creating pantry item:', error);
      res.status(500).json({ error: 'Failed to create pantry item' });
    }
  } else if (req.method === 'PUT') {
    // Update pantry item
    const { id, ...updateData } = req.body;

    if (!id) {
      return res.status(400).json({ error: 'Item ID is required' });
    }

    try {
      // Verify user is a member of the household
      const { data: item, error: itemError } = await supabase
        .from('pantry_items')
        .select('household_id')
        .eq('id', id)
        .single();

      if (itemError || !item) {
        return res.status(404).json({ error: 'Item not found' });
      }

      const { data: membership, error: membershipError } = await supabase
        .from('household_members')
        .select('*')
        .eq('household_id', item.household_id)
        .eq('user_id', updateData.created_by || req.body.created_by)
        .single();

      if (membershipError || !membership) {
        return res.status(403).json({ error: 'User is not a member of this household' });
      }

      // Update item
      const { data: updatedItem, error: updateError } = await supabase
        .from('pantry_items')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (updateError) throw updateError;

      res.status(200).json(updatedItem);
    } catch (error) {
      console.error('Error updating pantry item:', error);
      res.status(500).json({ error: 'Failed to update pantry item' });
    }
  } else if (req.method === 'DELETE') {
    // Delete pantry item
    const { id, user_id } = req.query;

    if (!id || !user_id) {
      return res.status(400).json({ error: 'Item ID and user ID are required' });
    }

    try {
      // Verify user is a member of the household
      const { data: item, error: itemError } = await supabase
        .from('pantry_items')
        .select('household_id')
        .eq('id', id)
        .single();

      if (itemError || !item) {
        return res.status(404).json({ error: 'Item not found' });
      }

      const { data: membership, error: membershipError } = await supabase
        .from('household_members')
        .select('*')
        .eq('household_id', item.household_id)
        .eq('user_id', user_id)
        .single();

      if (membershipError || !membership) {
        return res.status(403).json({ error: 'User is not a member of this household' });
      }

      // Delete item
      const { error: deleteError } = await supabase
        .from('pantry_items')
        .delete()
        .eq('id', id);

      if (deleteError) throw deleteError;

      res.status(200).json({ message: 'Item deleted successfully' });
    } catch (error) {
      console.error('Error deleting pantry item:', error);
      res.status(500).json({ error: 'Failed to delete pantry item' });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
} 