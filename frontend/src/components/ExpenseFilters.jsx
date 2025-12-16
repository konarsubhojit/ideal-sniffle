import { useState } from 'react';
import {
  Box,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Grid,
  Paper,
  Chip,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';

function ExpenseFilters({ groups, onFilterChange, activeFilters }) {
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

  const [filters, setFilters] = useState(activeFilters || {
    search: '',
    paidBy: '',
    category: '',
    minAmount: '',
    maxAmount: '',
  });

  const handleApplyFilters = () => {
    onFilterChange(filters);
  };

  const handleClearFilters = () => {
    const clearedFilters = {
      search: '',
      paidBy: '',
      category: '',
      minAmount: '',
      maxAmount: '',
    };
    setFilters(clearedFilters);
    onFilterChange(clearedFilters);
  };

  const hasActiveFilters = Object.values(filters).some(v => v !== '');

  return (
    <Paper sx={{ p: 2, mb: 2 }}>
      <Grid container spacing={2} alignItems="center">
        <Grid item xs={12} sm={6} md={3}>
          <TextField
            fullWidth
            label="Search description"
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            placeholder="Search..."
            size="small"
          />
        </Grid>

        <Grid item xs={12} sm={6} md={2}>
          <FormControl fullWidth size="small">
            <InputLabel>Paid By</InputLabel>
            <Select
              value={filters.paidBy}
              label="Paid By"
              onChange={(e) => setFilters({ ...filters, paidBy: e.target.value })}
            >
              <MenuItem value="">All</MenuItem>
              {groups.map(group => (
                <MenuItem key={group.id} value={group.id}>
                  {group.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        <Grid item xs={12} sm={6} md={2}>
          <FormControl fullWidth size="small">
            <InputLabel>Category</InputLabel>
            <Select
              value={filters.category}
              label="Category"
              onChange={(e) => setFilters({ ...filters, category: e.target.value })}
            >
              <MenuItem value="">All</MenuItem>
              {categories.map(category => (
                <MenuItem key={category} value={category}>
                  {category}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        <Grid item xs={6} sm={3} md={1.5}>
          <TextField
            fullWidth
            label="Min ₹"
            type="number"
            value={filters.minAmount}
            onChange={(e) => setFilters({ ...filters, minAmount: e.target.value })}
            size="small"
            inputProps={{ min: "0", step: "0.01" }}
          />
        </Grid>

        <Grid item xs={6} sm={3} md={1.5}>
          <TextField
            fullWidth
            label="Max ₹"
            type="number"
            value={filters.maxAmount}
            onChange={(e) => setFilters({ ...filters, maxAmount: e.target.value })}
            size="small"
            inputProps={{ min: "0", step: "0.01" }}
          />
        </Grid>

        <Grid item xs={6} sm={6} md={1}>
          <Button
            variant="contained"
            fullWidth
            onClick={handleApplyFilters}
            startIcon={<SearchIcon />}
          >
            Filter
          </Button>
        </Grid>

        <Grid item xs={6} sm={6} md={1}>
          <Button
            variant="outlined"
            fullWidth
            onClick={handleClearFilters}
            startIcon={<ClearIcon />}
            disabled={!hasActiveFilters}
          >
            Clear
          </Button>
        </Grid>
      </Grid>

      {hasActiveFilters && (
        <Box sx={{ mt: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          {filters.search && (
            <Chip 
              label={`Search: "${filters.search}"`} 
              onDelete={() => setFilters({ ...filters, search: '' })} 
              size="small"
            />
          )}
          {filters.paidBy && (
            <Chip 
              label={`Paid by: ${groups.find(g => g.id === parseInt(filters.paidBy))?.name}`} 
              onDelete={() => setFilters({ ...filters, paidBy: '' })} 
              size="small"
            />
          )}
          {filters.category && (
            <Chip 
              label={`Category: ${filters.category}`} 
              onDelete={() => setFilters({ ...filters, category: '' })} 
              size="small"
            />
          )}
          {filters.minAmount && (
            <Chip 
              label={`Min: ₹${filters.minAmount}`} 
              onDelete={() => setFilters({ ...filters, minAmount: '' })} 
              size="small"
            />
          )}
          {filters.maxAmount && (
            <Chip 
              label={`Max: ₹${filters.maxAmount}`} 
              onDelete={() => setFilters({ ...filters, maxAmount: '' })} 
              size="small"
            />
          )}
        </Box>
      )}
    </Paper>
  );
}

export default ExpenseFilters;
