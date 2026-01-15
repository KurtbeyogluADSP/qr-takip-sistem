-- =================================================================
-- STRICT RE-ENTRY MIGRATION
-- Tarih: 15.01.2026
-- Goal: Unlock users only via Admin QR token consumption.
-- =================================================================

-- RPC: Token İşleme ve Kilit Açma
CREATE OR REPLACE FUNCTION public.process_reentry_token(token_text TEXT)
RETURNS JSON
SECURITY DEFINER
AS $$
DECLARE
    found_token RECORD;
    user_record RECORD;
BEGIN
    -- 1. Token'ı bul (Type: re_entry_token, Valid time, Assigned to current user)
    SELECT * INTO found_token
    FROM qr_tokens
    WHERE token = token_text
      AND type = 're_entry_token'
      AND assigned_user_id = auth.uid()
      AND expires_at > now();

    IF found_token IS NULL THEN
        RAISE EXCEPTION 'Invalid or expired re-entry token.';
    END IF;

    -- 2. Eğer token bulunduysa, kullanıcı kilidini aç
    UPDATE public.users
    SET is_locked_out = false
    WHERE id = auth.uid();

    -- 3. Token'ı tüket (Sil veya used_at işaretle - Silmek daha temiz re-use önler)
    DELETE FROM qr_tokens WHERE id = found_token.id;

    RETURN json_build_object('success', true, 'message', 'Account unlocked successfully');
END;
$$ LANGUAGE plpgsql;

GRANT EXECUTE ON FUNCTION public.process_reentry_token(TEXT) TO authenticated;
