// Home.js
'use client';
import { useState, useEffect } from 'react';
import { Box, Modal, Typography, Stack, TextField, Button, Grid, CircularProgress } from '@mui/material';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { firestore } from "@/firebase";
import { collection, query, getDocs, doc, getDoc, setDoc, deleteDoc } from 'firebase/firestore';
import '@fontsource/poppins';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import SearchIcon from '@mui/icons-material/Search';
import ClientOnlyComponent from '../components/ClientOnlyComponent';

const theme = createTheme({
  palette: {
    primary: {
      main: '#00bfa6', // Teal
    },
    secondary: {
      main: '#ff4081', // Pink
    },
    background: {
      default: '#f5f5f5', // Light gray
    },
    text: {
      primary: '#333333',
    },
  },
  typography: {
    fontFamily: 'Poppins, sans-serif',
    h2: {
      fontWeight: 700,
      color: '#333333',
    },
    h5: {
      fontWeight: 500,
      color: '#333333',
    },
  },
  shadows: ['none', '0px 4px 12px rgba(0, 0, 0, 0.1)'],
});

export default function Home() {
  const [inventory, setInventory] = useState([]);
  const [filteredInventory, setFilteredInventory] = useState([]);
  const [open, setOpen] = useState(false);
  const [itemName, setItemName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    updateInventory();
  }, []);

  const updateInventory = async () => {
    setLoading(true);
    try {
      const snapshot = query(collection(firestore, 'inventory'));
      const docs = await getDocs(snapshot);
      const inventoryList = [];
      docs.forEach((doc) => {
        inventoryList.push({
          name: doc.id,
          ...doc.data(),
        });
      });
      setInventory(inventoryList);
      setFilteredInventory(inventoryList);
    } catch (error) {
      console.error("Failed to update inventory:", error);
    } finally {
      setLoading(false);
    }
  };

  const addItem = async (item) => {
    try {
      const docRef = doc(collection(firestore, 'inventory'), item);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const { quantity } = docSnap.data();
        await setDoc(docRef, { quantity: quantity + 1 });
      } else {
        await setDoc(docRef, { quantity: 1 });
      }
      await updateInventory();
    } catch (error) {
      console.error("Failed to add item:", error);
    }
  };

  const removeItem = async (item) => {
    try {
      const docRef = doc(collection(firestore, 'inventory'), item);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const { quantity } = docSnap.data();
        if (quantity === 1) {
          await deleteDoc(docRef);
        } else {
          await setDoc(docRef, { quantity: quantity - 1 });
        }
      }
      await updateInventory();
    } catch (error) {
      console.error("Failed to remove item:", error);
    }
  };

  const increaseQuantity = async (item) => {
    try {
      const docRef = doc(collection(firestore, 'inventory'), item);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const { quantity } = docSnap.data();
        await setDoc(docRef, { quantity: quantity + 1 });
      }
      await updateInventory();
    } catch (error) {
      console.error("Failed to increase quantity:", error);
    }
  };

  useEffect(() => {
    const lowercasedFilter = searchQuery.toLowerCase();
    const filteredData = inventory.filter(item =>
      item.name.toLowerCase().includes(lowercasedFilter)
    );
    setFilteredInventory(filteredData);
  }, [searchQuery, inventory]);

  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  return (
    <ThemeProvider theme={theme}>
      <Box
        width="100vw"
        minHeight="100vh"
        display="flex"
        flexDirection="column"
        justifyContent="center"
        alignItems="center"
        gap={2}
        sx={{
          background: 'linear-gradient(135deg, #e0e0e0, #ffffff)',
          padding: 4,
        }}
      >
        <Button
          variant="contained"
          onClick={handleOpen}
          startIcon={<AddIcon />}
          sx={{
            backgroundColor: theme.palette.primary.main,
            boxShadow: theme.shadows[1],
            '&:hover': {
              backgroundColor: theme.palette.primary.dark,
            },
          }}
        >
          Add New Item
        </Button>
        <TextField
          variant="outlined"
          placeholder="Search items"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          InputProps={{
            startAdornment: <SearchIcon sx={{ marginRight: 1, color: 'action.active' }} />,
          }}
          sx={{ marginBottom: 2, width: '800px', maxWidth: '90%' }}
        />
        <Box
          width="800px"
          maxWidth="90%"
          bgcolor="white"
          borderRadius={2}
          boxShadow={theme.shadows[1]}
        >
          <Box
            height="100px"
            display="flex"
            bgcolor="#00bfa6"
            alignItems="center"
            justifyContent="center"
            borderRadius="8px 8px 0 0"
          >
            <Typography variant="h2" color="#ffffff">
              Inventory Items
            </Typography>
          </Box>
          <Stack spacing={2} padding={2}>
            {loading ? (
              <Box display="flex" justifyContent="center" alignItems="center" height="200px">
                <CircularProgress />
              </Box>
            ) : (
              filteredInventory.map(({ name, quantity }) => (
                <Box
                  key={name}
                  display="flex"
                  alignItems="center"
                  justifyContent="space-between"
                  bgcolor="#f0f0f0"
                  padding={2}
                  borderRadius={1}
                  boxShadow={theme.shadows[1]}
                  sx={{
                    transition: 'transform 0.2s, box-shadow 0.2s',
                    '&:hover': {
                      transform: 'translateY(-2px)',
                      boxShadow: theme.shadows[2],
                    },
                  }}
                >
                  <Typography variant="h5" color={theme.palette.text.primary}>
                    {name.charAt(0).toUpperCase() + name.slice(1)}
                  </Typography>
                  <Typography variant="h5" color={theme.palette.text.primary}>
                    {quantity}
                  </Typography>
                  <Stack direction="row" spacing={1}>
                    <Button
                      variant="contained"
                      onClick={() => increaseQuantity(name)}
                      startIcon={<AddIcon />}
                      sx={{
                        backgroundColor: theme.palette.primary.main,
                        '&:hover': {
                          backgroundColor: theme.palette.primary.dark,
                        },
                      }}
                    >
                      Add
                    </Button>
                    <Button
                      variant="contained"
                      onClick={() => removeItem(name)}
                      startIcon={<RemoveIcon />}
                      sx={{
                        backgroundColor: theme.palette.secondary.main,
                        '&:hover': {
                          backgroundColor: theme.palette.secondary.dark,
                        },
                      }}
                    >
                      Remove
                    </Button>
                  </Stack>
                </Box>
              ))
            )}
          </Stack>
        </Box>
        <ClientOnlyComponent />
      </Box>
    </ThemeProvider>
  );
}
