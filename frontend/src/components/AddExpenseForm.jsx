import {
  Box,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Button,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';

function AddExpenseForm({ groups, formData, onFormChange, onSubmit }) {
  return (
    <Box component="form" onSubmit={onSubmit}>
      <Grid container spacing={2}>
        <Grid item xs={12} sm={6} md={3}>
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
        
        <Grid item xs={12} sm={6} md={3}>
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
        
        <Grid item xs={12} sm={6} md={3}>
          <TextField
            fullWidth
            label="Description"
            value={formData.description}
            onChange={(e) => onFormChange({ ...formData, description: e.target.value })}
            placeholder="Optional"
          />
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Button
            type="submit"
            variant="contained"
            fullWidth
            size="large"
            startIcon={<AddIcon />}
            sx={{ height: '56px' }}
          >
            Add Expense
          </Button>
        </Grid>
      </Grid>
    </Box>
  );
}

export default AddExpenseForm;
