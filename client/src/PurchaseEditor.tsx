import {
  AppBar,
  Box,
  Button,
  Chip,
  Container,
  FormGroup,
  IconButton,
  InputAdornment,
  Paper,
  TextField,
  Toolbar,
  Typography,
  useMediaQuery,
  useTheme
} from '@material-ui/core';
import DoneIcon from '@material-ui/icons/Done';
import Autocomplete from '@material-ui/lab/Autocomplete';
import { KeyboardDatePicker } from '@material-ui/pickers';
import { runInAction } from 'mobx';
import { observer } from 'mobx-react';
import React, { useState } from 'react';
import { useHistory } from 'react-router-dom';

import BackButton from './BackButton';
import { Purchase, useStore } from './data/store';

export interface PurchaseEditorProps {
  title?: string;
  purchase: Purchase;
  onSave: () => void;
}

const PurchaseEditor: React.FC<PurchaseEditorProps> = observer(props => {
  const { purchase } = props;

  const [name, setName] = useState(purchase.product.name);
  const [inputtedName, setInputtedName] = useState(name);
  const [tags, setTags] = useState(purchase.tagsSortedByName.map(t => t.name));
  const tagSet = new Set(tags.map(t => t.toLowerCase()));
  const [date, setDate] = useState(purchase.date);
  const [quantity, setQuantity] = useState(purchase.quantity.toLocaleString());
  const [price, setPrice] = useState(purchase.price.toLocaleString());

  const [newTag, setNewTag] = useState('');
  const [inputtedNewTag, setInputtedNewTag] = useState(newTag);

  const theme = useTheme();
  const atLeastMedium = useMediaQuery(theme.breakpoints.up('md'));

  const history = useHistory();
  const store = useStore();

  async function save() {
    const [product, tagObjects] = await Promise.all([
      store.addProduct(inputtedName),
      store.addTags(tags),
    ]);
    runInAction(() => {
      purchase.product = product;
      purchase.tags = tagObjects;
      purchase.date = date;
      purchase.quantity = parseNumber(quantity);
      purchase.price = parseNumber(price);
    });
    props.onSave();
    history.goBack();
  }

  function addTag() {
    const newTagName = inputtedNewTag.trim();
    if (newTagName === '') {
      return;
    }
    if (!tagSet.has(newTagName.toLowerCase())) {
      setTags([...tags, newTagName]);
    }
    setNewTag('');
    setInputtedNewTag('');
  }

  function deleteTag(tag: string) {
    const lowerCase = tag.toLowerCase();
    setTags(tags.filter(t => t.toLowerCase() !== lowerCase));
  }

  return <>
    <AppBar position='sticky'>
      <Toolbar>
        <BackButton />
        <Box flexGrow={1}>
          <Typography variant='h6'>
            {props.title ?? 'Edit Purchase'}
          </Typography>
        </Box>
        <IconButton color='inherit' onClick={save}>
          <DoneIcon />
        </IconButton>
      </Toolbar>
    </AppBar>
    <Container fixed>
      <Paper>
        <Box p={2}>
          <FormGroup>
            <Autocomplete
              freeSolo
              options={store.products.map(p => p.name)}
              value={name}
              onChange={(e, v) => setName(v ?? '')}
              onInputChange={(e, v) => setInputtedName(v ?? '')}
              renderInput={params => (
                <TextField
                  {...params}
                  label='Product'
                  fullWidth />
              )} />
            <KeyboardDatePicker
              label='Purchase Date'
              variant={atLeastMedium ? 'inline' : 'dialog'}
              format='dd.MM.yyyy'
              margin='normal'
              value={date}
              onChange={d => setDate(d ?? purchase.date)} />
            <TextField
              label='Price'
              type='number'
              value={price}
              onChange={e => setPrice(e.target.value)}
              InputProps={{
                endAdornment: <InputAdornment position='end'>€</InputAdornment>
              }} />
            <TextField
              label='Quantity'
              type='number'
              value={quantity}
              onChange={e => setQuantity(e.target.value)} />
            <Box display='flex'>
              <Box flexGrow={1}>
                <Autocomplete
                  freeSolo
                  options={store.tags.map(t => t.name)}
                  value={newTag}
                  onChange={(e, v) => setNewTag(v ?? '')}
                  onInputChange={(e, v) => setInputtedNewTag(v ?? '')}
                  renderInput={params => (
                    <TextField
                      {...params}
                      label='Add Tag'
                      fullWidth />
                  )} />
              </Box>
              <Button variant='contained' color='primary' onClick={addTag}>
                Add
              </Button>
            </Box>
            <Box display='flex' flexWrap='wrap' mt={1}>
              {tags.map(t => (
                <Box m={1} key={t}>
                  <Chip label={t} onDelete={() => deleteTag(t)} />
                </Box>
              ))}
            </Box>
          </FormGroup>
        </Box>
      </Paper>
    </Container>
  </>;
});

function parseNumber(s: string) {
  const n = parseFloat(s);
  if (isNaN(n)) {
    throw new Error(`Invalid number: ${s}`);
  }
  return n;
}

export default PurchaseEditor;