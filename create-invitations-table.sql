-- Create household_invitations table for pending invitations
CREATE TABLE IF NOT EXISTS household_invitations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    household_id UUID NOT NULL REFERENCES households(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'member')),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
    invited_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '7 days')
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_household_invitations_household_id ON household_invitations(household_id);
CREATE INDEX IF NOT EXISTS idx_household_invitations_email ON household_invitations(email);
CREATE INDEX IF NOT EXISTS idx_household_invitations_status ON household_invitations(status);

-- Enable RLS
ALTER TABLE household_invitations ENABLE ROW LEVEL SECURITY;

-- RLS Policies for household_invitations
CREATE POLICY "Users can view invitations they sent" ON household_invitations
    FOR SELECT USING (invited_by = auth.uid());

CREATE POLICY "Household owners can view invitations for their households" ON household_invitations
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM households 
            WHERE households.id = household_invitations.household_id 
            AND households.owner_id = auth.uid()
        )
    );

CREATE POLICY "Household owners can create invitations" ON household_invitations
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM households 
            WHERE households.id = household_invitations.household_id 
            AND households.owner_id = auth.uid()
        )
    );

CREATE POLICY "Users can update their own invitations" ON household_invitations
    FOR UPDATE USING (email = (SELECT email FROM profiles WHERE id = auth.uid()));

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_household_invitations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
CREATE TRIGGER update_household_invitations_updated_at
    BEFORE UPDATE ON household_invitations
    FOR EACH ROW
    EXECUTE FUNCTION update_household_invitations_updated_at(); 