import { useState } from 'react';
import { Box, Dialog, DialogContent, IconButton, Skeleton, Tooltip } from '@mui/material';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import CloseIcon from '@mui/icons-material/Close';
import { useReceiptUrl } from '../hooks/useExpenses';

function ReceiptPreview({ expense }) {
  const [open, setOpen] = useState(false);
  const { data, isLoading } = useReceiptUrl(expense.id, expense.receiptId);
  const isImage = expense.receiptMimeType?.startsWith('image/');

  if (!expense.receiptId) return null;
  if (isLoading) return <Skeleton variant="rounded" width={48} height={48} />;

  return (
    <>
      <Tooltip title="View receipt">
        <IconButton onClick={() => setOpen(true)} disabled={!data?.url} size="small">
          {isImage && data?.url ? (
            <Box
              component="img"
              src={data.url}
              alt="Receipt thumbnail"
              sx={{ width: 48, height: 48, objectFit: 'cover', borderRadius: 1 }}
            />
          ) : (
            <ReceiptLongIcon />
          )}
        </IconButton>
      </Tooltip>
      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="lg" fullWidth>
        <IconButton
          onClick={() => setOpen(false)}
          aria-label="Close receipt"
          sx={{ position: 'absolute', right: 8, top: 8, zIndex: 1, bgcolor: 'background.paper' }}
        >
          <CloseIcon />
        </IconButton>
        <DialogContent sx={{ display: 'flex', justifyContent: 'center', minHeight: 400 }}>
          {isImage ? (
            <Box component="img" src={data?.url} alt="Receipt" sx={{ maxWidth: '100%', maxHeight: '80vh' }} />
          ) : (
            <Box
              component="iframe"
              src={data?.url}
              title="Receipt"
              sx={{ width: '100%', height: '75vh', border: 0 }}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

export default ReceiptPreview;
