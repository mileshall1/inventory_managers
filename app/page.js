'use client';

import dynamic from 'next/dynamic';
import { useState, useEffect } from 'react';
import { Box, Modal, Typography, Stack, TextField, Button, Grid } from '@mui/material';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { firestore } from "@/firebase";
import { collection, query, getDocs, doc, getDoc, setDoc, deleteDoc } from 'firebase/firestore';
import '@fontsource/poppins'; // Import Poppins font

// Dynamically import client-only components
const ClientOnlyComponent = dynamic(() => import('../components/ClientOnlyComponent'), {
  ssr: false
});

// Create a custom theme for consistent styling
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

  // Fetch inventory only on the client side
  useEffect(() => {
    if (typeof window !== 'undefined') {
      updateInventory();
    }
  }, []);

  const updateInventory = async () => {
    if (typeof window !== 'undefined') {
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
      }
    }
  };

  const addItem = async (item) => {
    if (typeof window !== 'undefined') {
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
    }
  };

  const removeItem = async (item) => {
    if (typeof window !== 'undefined') {
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
    }
  };

  const increaseQuantity = async (item) => {
    if (typeof window !== 'undefined') {
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
    }
  };

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const lowercasedFilter = searchQuery.toLowerCase();
      const filteredData = inventory.filter(item =>
        item.name.toLowerCase().includes(lowercasedFilter)
      );
      setFilteredInventory(filteredData);
    }
  }, [searchQuery, inventory]);

  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  return (
    <ThemeProvider theme={theme}>
      <Box
        width="100vw"
        height="100vh"
        display="flex"
        flexDirection="column"
        justifyContent="center"
        alignItems="center"
        gap={2}
        sx={{
          background: 'linear-gradient(135deg, #e0e0e0, #ffffff)',
        }}
      >
        <Modal open={open} onClose={handleClose}>
          <Box
            position="absolute"
            top="50%"
            left="50%"
            width={400}
            bgcolor="white"
            border="2px solid #000"
            boxShadow={2}
            p={4}
            display="flex"
            flexDirection="column"
            gap={3}
            sx={{
              transform: 'translate(-50%, -50%)',
            }}
          >
            <Typography variant="h6">Add Item</Typography>
            <Stack width="100%" direction="row" spacing={2}>
              <TextField
                variant="outlined"
                fullWidth
                value={itemName}
                onChange={(e) => setItemName(e.target.value)}
              />
              <Button
                variant="contained"
                onClick={() => {
                  addItem(itemName);
                  setItemName('');
                  handleClose();
                }}
              >
                Add
              </Button>
            </Stack>
          </Box>
        </Modal>
        <Button
          variant="contained"
          onClick={handleOpen}
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
          sx={{ marginBottom: 2, width: '800px' }}
        />
        <Box border="1px solid #333" width="800px">
          <Box
            height="100px"
            display="flex"
            bgcolor="#00bfa6"
            alignItems="center"
            justifyContent="center"
            boxShadow={theme.shadows[1]}
          >
            <Typography variant="h2" color="#ffffff">
              Inventory Items
            </Typography>
          </Box>
          <Stack spacing={2} padding={2}>
            {filteredInventory.map(({ name, quantity }) => (
              <Grid
                container
                key={name}
                alignItems="center"
                justifyContent="space-between"
                bgcolor="#f0f0f0"
                padding={2}
                boxShadow={theme.shadows[1]}
              >
                <Grid item xs={4}>
                  <Typography
                    variant="h5"
                    color={theme.palette.text.primary}
                  >
                    {name.charAt(0).toUpperCase() + name.slice(1)}
                  </Typography>
                </Grid>
                <Grid item xs={2} display="flex" justifyContent="center">
                  <Typography
                    variant="h5"
                    color={theme.palette.text.primary}
                  >
                    {quantity}
                  </Typography>
                </Grid>
                <Grid item xs={6} display="flex" justifyContent="flex-end">
                  <Stack direction="row" spacing={1}>
                    <Button
                      variant="contained"
                      onClick={() => increaseQuantity(name)}
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
                </Grid>
              </Grid>
            ))}
          </Stack>
        </Box>
        <ClientOnlyComponent />
      </Box>
    </ThemeProvider>
  );
}
