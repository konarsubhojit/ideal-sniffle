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
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  IconButton,
} from '@mui/material';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import CreateIcon from '@mui/icons-material/Create';
import VisibilityIcon from '@mui/icons-material/Visibility';
import BlockIcon from '@mui/icons-material/Block';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { useUsers, useUserStats, useUpdateUserRole } from '../hooks/useUsers';
import { useGroups, useAddGroup, useUpdateGroup, useDeleteGroup } from '../hooks/useExpenses';
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
  const { data: groups = [], isLoading: groupsLoading } = useGroups();
  const updateUserRole = useUpdateUserRole();
  const addGroup = useAddGroup();
  const updateGroup = useUpdateGroup();
  const deleteGroup = useDeleteGroup();
  const showSnackbar = useSnackbar();

  const [groupDialogOpen, setGroupDialogOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState(null);
  const [groupFormData, setGroupFormData] = useState({
    name: '',
    count: 1,
    type: 'Internal',
  });

    const handleRoleChange = async (userId, newRole) => {
    try {
      await updateUserRole.mutateAsync({ 
        userId, 
        role: newRole === 'none' ? null : newRole 
      });
      showSnackbar('Role updated! User must log out and log back in for the new permissions to take effect.', 'success');
    } catch (error) {
      console.error('Error updating role:', error);
      showSnackbar(error.message || 'Failed to update role', 'error');
    }
  };

  const handleOpenGroupDialog = (group = null) => {
    if (group) {
      setEditingGroup(group);
      setGroupFormData({
        name: group.name,
        count: group.count,
        type: group.type,
      });
    } else {
      setEditingGroup(null);
      setGroupFormData({ name: '', count: 1, type: 'Internal' });
    }
    setGroupDialogOpen(true);
  };

  const handleSaveGroup = async () => {
    try {
      if (editingGroup) {
        await updateGroup.mutateAsync({
          id: editingGroup.id,
          ...groupFormData,
        });
        showSnackbar('Group updated successfully!', 'success');
      } else {
        await addGroup.mutateAsync(groupFormData);
        showSnackbar('Group created successfully!', 'success');
      }
      setGroupDialogOpen(false);
    } catch (error) {
      console.error('Error saving group:', error);
      showSnackbar(error.message || 'Failed to save group', 'error');
    }
  };

  const handleDeleteGroup = async (groupId) => {
    if (!window.confirm('Are you sure you want to delete this group? This cannot be undone.')) {
      return;
    }
    
    try {
      await deleteGroup.mutateAsync(groupId);
      showSnackbar('Group deleted successfully!', 'success');
    } catch (error) {
      console.error('Error deleting group:', error);
      showSnackbar(error.message || 'Failed to delete group', 'error');
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

  if (usersLoading || statsLoading || groupsLoading) {
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
          <Tab label="Groups Management" />
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
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h6">Manage Groups</Typography>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => handleOpenGroupDialog()}
              >
                Add Group
              </Button>
            </Box>

            <TableContainer component={Paper} variant="outlined">
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Name</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell>Member Count</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {groups.map((group) => (
                    <TableRow key={group.id}>
                      <TableCell>{group.name}</TableCell>
                      <TableCell>
                        <Chip
                          label={group.type}
                          size="small"
                          color={group.type === 'External' ? 'secondary' : 'primary'}
                        />
                      </TableCell>
                      <TableCell>{group.count}</TableCell>
                      <TableCell>
                        <IconButton
                          size="small"
                          onClick={() => handleOpenGroupDialog(group)}
                          title="Edit group"
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleDeleteGroup(group.id)}
                          title="Delete group"
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </TabPanel>
      </Card>

      {/* Group Dialog */}
      <Dialog open={groupDialogOpen} onClose={() => setGroupDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editingGroup ? 'Edit Group' : 'Add New Group'}</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              fullWidth
              label="Group Name"
              value={groupFormData.name}
              onChange={(e) => setGroupFormData({ ...groupFormData, name: e.target.value })}
              required
            />
            <TextField
              fullWidth
              label="Member Count"
              type="number"
              value={groupFormData.count}
              onChange={(e) => setGroupFormData({ ...groupFormData, count: parseInt(e.target.value) || 1 })}
              inputProps={{ min: 1 }}
              required
            />
            <FormControl fullWidth>
              <Typography variant="body2" sx={{ mb: 1 }}>Type</Typography>
              <Select
                value={groupFormData.type}
                onChange={(e) => setGroupFormData({ ...groupFormData, type: e.target.value })}
              >
                <MenuItem value="Internal">Internal</MenuItem>
                <MenuItem value="External">External</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setGroupDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleSaveGroup}
            variant="contained"
            disabled={!groupFormData.name || groupFormData.count < 1}
          >
            {editingGroup ? 'Save Changes' : 'Add Group'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default AdminPage;
