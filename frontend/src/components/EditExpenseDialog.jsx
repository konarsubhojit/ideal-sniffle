import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Button,
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import CancelIcon from '@mui/icons-material/Cancel';

function EditExpenseDialog({ open, groups, formData, onFormChange, onSave, onClose }) {
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
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Edit Expense</DialogTitle>
      <DialogContent>
        <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
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
          
          <TextField
            fullWidth
            label="Amount (₹)"
            type="number"
            value={formData.amount}
            onChange={(e) => onFormChange({ ...formData, amount: e.target.value })}
            inputProps={{ step: "0.01", min: "0" }}
            required
          />
          
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
          
          <TextField
            fullWidth
            label="Description"
            value={formData.description}
            onChange={(e) => onFormChange({ ...formData, description: e.target.value })}
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} startIcon={<CancelIcon />}>
          Cancel
        </Button>
        <Button onClick={onSave} variant="contained" startIcon={<SaveIcon />}>
          Save Changes
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default EditExpenseDialog;
