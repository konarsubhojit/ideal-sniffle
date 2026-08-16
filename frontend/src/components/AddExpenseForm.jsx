import {
  Box,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Button,
  Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import CameraAltIcon from '@mui/icons-material/CameraAlt';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';

function AddExpenseForm({
  groups,
  formData,
  onFormChange,
  onSubmit,
  receiptFile,
  onReceiptSelect,
  onScanReceipt,
  scanEnabled,
  storageEnabled,
  isScanning,
  canModify,
}) {
  const categories = [
    'Food & Dining',
    'Transportation',
    'Shopping',
    'Entertainment',
    'Utilities',
    'Healthcare',
    'Travel',
    'Other'
  ];

  return (
    <Box component="form" onSubmit={onSubmit}>
      <Grid container spacing={2}>
        {canModify && (storageEnabled || scanEnabled) && (
          <Grid item xs={12}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
              <Button component="label" variant="outlined" startIcon={<CameraAltIcon />}>
                {storageEnabled ? 'Capture / attach receipt' : 'Capture receipt'}
                <input
                  hidden
                  type="file"
                  accept="image/jpeg,image/png,image/webp,application/pdf"
                  capture="environment"
                  onChange={event => onReceiptSelect(event.target.files?.[0] || null)}
                />
              </Button>
              {scanEnabled && (
                <Button
                  variant="outlined"
                  startIcon={<AutoAwesomeIcon />}
                  onClick={onScanReceipt}
                  disabled={!receiptFile || isScanning}
                >
                  {isScanning ? 'Scanning…' : 'Scan receipt'}
                </Button>
              )}
              {receiptFile && (
                <Typography variant="body2" color="text.secondary">
                  {receiptFile.name}
                </Typography>
              )}
            </Box>
          </Grid>
        )}
        <Grid item xs={12} sm={6} md={2.4}>
          <FormControl fullWidth>
            <InputLabel>Who Paid?</InputLabel>
            <Select
              value={formData.paidBy}
              label="Who Paid?"
              onChange={(e) => onFormChange({ ...formData, paidBy: e.target.value })}
            >
              {groups.map(group => (
                <MenuItem key={group.id} value={group.id}>
                  {group.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        
        <Grid item xs={12} sm={6} md={2.4}>
          <TextField
            fullWidth
            label="Amount (₹)"
            type="number"
            value={formData.amount}
            onChange={(e) => onFormChange({ ...formData, amount: e.target.value })}
            inputProps={{ step: "0.01", min: "0" }}
            required
          />
        </Grid>
        
        <Grid item xs={12} sm={6} md={2.4}>
          <FormControl fullWidth>
            <InputLabel>Category</InputLabel>
            <Select
              value={formData.category || ''}
              label="Category"
              onChange={(e) => onFormChange({ ...formData, category: e.target.value })}
            >
              <MenuItem value="">
                <em>None</em>
              </MenuItem>
              {categories.map(category => (
                <MenuItem key={category} value={category}>
                  {category}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        
        <Grid item xs={12} sm={6} md={2.4}>
          <TextField
            fullWidth
            label="Description"
            value={formData.description}
            onChange={(e) => onFormChange({ ...formData, description: e.target.value })}
            placeholder="Optional"
          />
        </Grid>
        
        <Grid item xs={12} sm={6} md={2.4}>
          <Button
            type="submit"
            variant="contained"
            fullWidth
            size="large"
            startIcon={<AddIcon />}
            sx={{ height: '56px' }}
            disabled={!canModify}
          >
            Add Expense
          </Button>
        </Grid>
      </Grid>
    </Box>
  );
}

export default AddExpenseForm;
