import { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Select,
  MenuItem,
  FormControl,
  CircularProgress,
  Chip,
  Grid,
  Alert,
} from '@mui/material';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import CreateIcon from '@mui/icons-material/Create';
import VisibilityIcon from '@mui/icons-material/Visibility';
import BlockIcon from '@mui/icons-material/Block';
import { useUsers, useUserStats, useUpdateUserRole } from '../hooks/useUsers';
import { useSnackbar } from '../contexts/SnackbarContext';

function TabPanel({ children, value, index }) {
  return (
    <div hidden={value !== index} style={{ paddingTop: 24 }}>
      {value === index && children}
    </div>
  );
}

function AdminPage() {
  const [tabValue, setTabValue] = useState(0);
  const { data: users = [], isLoading: usersLoading } = useUsers();
  const { data: stats, isLoading: statsLoading } = useUserStats();
  const updateUserRole = useUpdateUserRole();
  const showSnackbar = useSnackbar();

  const handleRoleChange = async (userId, newRole) => {
    try {
      await updateUserRole.mutateAsync({ 
        userId, 
        role: newRole === 'none' ? null : newRole 
      });
      showSnackbar(`Role updated successfully! User must log out and log back in.`, 'success');
    } catch (error) {
      console.error('Error updating role:', error);
      showSnackbar(error.message || 'Failed to update role', 'error');
    }
  };

  const getRoleChip = (role) => {
    if (!role) {
      return <Chip icon={<BlockIcon />} label="No Access" size="small" color="default" />;
    }
    
    switch (role) {
      case 'admin':
        return <Chip icon={<AdminPanelSettingsIcon />} label="Admin" size="small" color="error" />;
      case 'contributor':
        return <Chip icon={<CreateIcon />} label="Contributor" size="small" color="success" />;
      case 'reader':
        return <Chip icon={<VisibilityIcon />} label="Reader" size="small" color="info" />;
      default:
        return <Chip label={role} size="small" />;
    }
  };

  if (usersLoading || statsLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 600 }}>
        Admin Panel
      </Typography>

      {/* Statistics Cards */}
      {stats && (
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={2.4}>
            <Card>
              <CardContent>
                <Typography color="text.secondary" gutterBottom variant="body2">
                  Total Users
                </Typography>
                <Typography variant="h4" sx={{ fontWeight: 600 }}>
                  {stats.total}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={2.4}>
            <Card>
              <CardContent>
                <Typography color="text.secondary" gutterBottom variant="body2">
                  Admins
                </Typography>
                <Typography variant="h4" sx={{ fontWeight: 600, color: 'error.main' }}>
                  {stats.admins}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={2.4}>
            <Card>
              <CardContent>
                <Typography color="text.secondary" gutterBottom variant="body2">
                  Contributors
                </Typography>
                <Typography variant="h4" sx={{ fontWeight: 600, color: 'success.main' }}>
                  {stats.contributors}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={2.4}>
            <Card>
              <CardContent>
                <Typography color="text.secondary" gutterBottom variant="body2">
                  Readers
                </Typography>
                <Typography variant="h4" sx={{ fontWeight: 600, color: 'info.main' }}>
                  {stats.readers}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={2.4}>
            <Card>
              <CardContent>
                <Typography color="text.secondary" gutterBottom variant="body2">
                  No Access
                </Typography>
                <Typography variant="h4" sx={{ fontWeight: 600, color: 'text.secondary' }}>
                  {stats.no_role}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      <Card>
        <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)}>
          <Tab label="User Management" />
          <Tab label="Groups Management" disabled />
        </Tabs>

        <TabPanel value={tabValue} index={0}>
          <CardContent>
            <Alert severity="info" sx={{ mb: 3 }}>
              Users must log out and log back in for role changes to take effect.
            </Alert>

            <TableContainer component={Paper} variant="outlined">
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Name</TableCell>
                    <TableCell>Email</TableCell>
                    <TableCell>Current Role</TableCell>
                    <TableCell>Change Role</TableCell>
                    <TableCell>Last Login</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          {user.picture && (
                            <img 
                              src={user.picture} 
                              alt={user.name} 
                              style={{ width: 32, height: 32, borderRadius: '50%' }}
                            />
                          )}
                          {user.name}
                        </Box>
                      </TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>{getRoleChip(user.role)}</TableCell>
                      <TableCell>
                        <FormControl size="small" sx={{ minWidth: 140 }}>
                          <Select
                            value={user.role || 'none'}
                            onChange={(e) => handleRoleChange(user.id, e.target.value)}
                            disabled={updateUserRole.isPending}
                          >
                            <MenuItem value="admin">Admin</MenuItem>
                            <MenuItem value="contributor">Contributor</MenuItem>
                            <MenuItem value="reader">Reader</MenuItem>
                            <MenuItem value="none">No Access</MenuItem>
                          </Select>
                        </FormControl>
                      </TableCell>
                      <TableCell>
                        {user.lastLogin 
                          ? new Date(user.lastLogin).toLocaleDateString()
                          : 'Never'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          <CardContent>
            <Typography>Groups management coming soon...</Typography>
          </CardContent>
        </TabPanel>
      </Card>
    </Box>
  );
}

export default AdminPage;
