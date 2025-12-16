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
  Stack,
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
    startDate: '',
    endDate: '',
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
      startDate: '',
      endDate: '',
    };
    setFilters(clearedFilters);
    onFilterChange(clearedFilters);
  };

  const setQuickDateRange = (range) => {
    const today = new Date();
    let startDate = '';
    let endDate = today.toISOString().split('T')[0];

    switch (range) {
      case 'today':
        startDate = endDate;
        break;
      case 'week':
        startDate = new Date(today.setDate(today.getDate() - 7)).toISOString().split('T')[0];
        break;
      case 'month':
        startDate = new Date(today.setMonth(today.getMonth() - 1)).toISOString().split('T')[0];
        break;
      case 'year':
        startDate = new Date(today.setFullYear(today.getFullYear() - 1)).toISOString().split('T')[0];
        break;
      default:
        break;
    }

    const newFilters = { ...filters, startDate, endDate };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const hasActiveFilters = Object.values(filters).some(v => v !== '');

  return (
    <Paper sx={{ p: 2, mb: 2 }}>
      <Grid container spacing={2} alignItems="center">
        <Grid item xs={12} sm={6} md={2.5}>
          <TextField
            fullWidth
            label="Search description"
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            placeholder="Search..."
            size="small"
          />
        </Grid>

        <Grid item xs={12} sm={6} md={1.5}>
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

        <Grid item xs={12} sm={6} md={1.5}>
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

        <Grid item xs={6} sm={3} md={1.25}>
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

        <Grid item xs={6} sm={3} md={1.25}>
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

        <Grid item xs={6} sm={6} md={1.5}>
          <TextField
            fullWidth
            label="Start Date"
            type="date"
            value={filters.startDate}
            onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
            size="small"
            InputLabelProps={{ shrink: true }}
          />
        </Grid>

        <Grid item xs={6} sm={6} md={1.5}>
          <TextField
            fullWidth
            label="End Date"
            type="date"
            value={filters.endDate}
            onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
            size="small"
            InputLabelProps={{ shrink: true }}
          />
        </Grid>

        <Grid item xs={6} sm={6} md={0.5}>
          <Button
            variant="contained"
            fullWidth
            onClick={handleApplyFilters}
            sx={{ minWidth: 0 }}
          >
            <SearchIcon />
          </Button>
        </Grid>

        <Grid item xs={6} sm={6} md={0.5}>
          <Button
            variant="outlined"
            fullWidth
            onClick={handleClearFilters}
            disabled={!hasActiveFilters}
            sx={{ minWidth: 0 }}
          >
            <ClearIcon />
          </Button>
        </Grid>
      </Grid>

      {/* Quick date range buttons */}
      <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
        <Button size="small" variant="outlined" onClick={() => setQuickDateRange('today')}>
          Today
        </Button>
        <Button size="small" variant="outlined" onClick={() => setQuickDateRange('week')}>
          Last 7 Days
        </Button>
        <Button size="small" variant="outlined" onClick={() => setQuickDateRange('month')}>
          Last 30 Days
        </Button>
        <Button size="small" variant="outlined" onClick={() => setQuickDateRange('year')}>
          Last Year
        </Button>
      </Stack>

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
          {filters.startDate && (
            <Chip 
              label={`From: ${new Date(filters.startDate).toLocaleDateString()}`} 
              onDelete={() => setFilters({ ...filters, startDate: '' })} 
              size="small"
            />
          )}
          {filters.endDate && (
            <Chip 
              label={`To: ${new Date(filters.endDate).toLocaleDateString()}`} 
              onDelete={() => setFilters({ ...filters, endDate: '' })} 
              size="small"
            />
          )}
        </Box>
      )}
    </Paper>
  );
}

export default ExpenseFilters;
