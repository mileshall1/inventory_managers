'use client';

import dynamic from 'next/dynamic';
import { useState, useEffect } from 'react';
import { Box, Modal, Typography, Stack, TextField, Button, Grid } from '@mui/material';
import { firestore } from "@/firebase";
import { collection, query, getDocs, doc, getDoc, setDoc, deleteDoc } from 'firebase/firestore';

// Dynamically import the client-only component
const ClientOnlyComponent = dynamic(() => import('../components/ClientOnlyComponent'), {
  ssr: false
});

export default function Home() {
  const [inventory, setInventory] = useState([]);
  const [filteredInventory, setFilteredInventory] = useState([]);
  const [open, setOpen] = useState(false);
  const [itemName, setItemName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  
  // State to check if running in the browser
  const [isBrowser, setIsBrowser] = useState(false);

  // Set isBrowser to true if running in the browser
  useEffect(() => {
    setIsBrowser(typeof window !== 'undefined');
  }, []);

  // Update inventory if running in the browser
  useEffect(() => {
    if (isBrowser) {
      updateInventory();
    }
  }, [isBrowser]);

  // Fetch and update inventory
  const updateInventory = async () => {
    if (isBrowser) {
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
    }
  };

  // Add item to inventory
  const addItem = async (item) => {
    if (isBrowser) {
      const docRef = doc(collection(firestore, 'inventory'), item);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const { quantity } = docSnap.data();
        await setDoc(docRef, { quantity: quantity + 1 });
      } else {
        await setDoc(docRef, { quantity: 1 });
      }
      await updateInventory();
    }
  };

  // Remove item from inventory
  const removeItem = async (item) => {
    if (isBrowser) {
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
    }
  };

  // Increase item quantity
  const increaseQuantity = async (item) => {
    if (isBrowser) {
      const docRef = doc(collection(firestore, 'inventory'), item);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const { quantity } = docSnap.data();
        await setDoc(docRef, { quantity: quantity + 1 });
      }
      await updateInventory();
    }
  };

  // Filter inventory based on search query
  useEffect(() => {
    if (isBrowser) {
      const lowercasedFilter = searchQuery.toLowerCase();
      const filteredData = inventory.filter(item =>
        item.name.toLowerCase().includes(lowercasedFilter)
      );
      setFilteredInventory(filteredData);
    }
  }, [searchQuery, inventory, isBrowser]);

  // Open and close modal handlers
  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  return (
    <Box
      width="100vw"
      height="100vh"
      display="flex"
      flexDirection="column"
      justifyContent="center"
      alignItems="center"
      gap={2}
      sx={{
        background: 'linear-gradient(135deg, #f5f5f5, #c2c2c2)',
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
          boxShadow={24}
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
              variant="outlined"
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
          bgcolor="#ADD8E6"
          alignItems="center"
          justifyContent="center"
        >
          <Typography variant="h2" color="#333">
            Inventory Items
          </Typography>
        </Box>
        <Stack
          spacing={2}
          padding={2}
        >
          {filteredInventory.map(({ name, quantity }) => (
            <Grid
              container
              key={name}
              alignItems="center"
              justifyContent="space-between"
              bgcolor="#f0f0f0"
              padding={2}
            >
              <Grid item xs={4}>
                <Typography
                  variant="h5"
                  color="#333"
                >
                  {name.charAt(0).toUpperCase() + name.slice(1)}
                </Typography>
              </Grid>
              <Grid item xs={2} display="flex" justifyContent="center">
                <Typography
                  variant="h5"
                  color="#333"
                >
                  {quantity}
                </Typography>
              </Grid>
              <Grid item xs={6} display="flex" justifyContent="flex-end">
                <Stack direction="row" spacing={1}>
                  <Button
                    variant="contained"
                    onClick={() => increaseQuantity(name)}
                  >
                    Add
                  </Button>
                  <Button
                    variant="contained"
                    onClick={() => removeItem(name)}
                  >
                    Remove
                  </Button>
                </Stack>
              </Grid>
            </Grid>
          ))}
        </Stack>
      </Box>
      {/* Dynamically loaded client-only component */}
      {isBrowser && <ClientOnlyComponent />}
    </Box>
  );
}
