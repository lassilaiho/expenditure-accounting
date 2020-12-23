import {
  Box,
  Chip,
  FormGroup,
  IconButton,
  InputAdornment,
  Paper,
  TextField,
  useMediaQuery,
  useTheme,
} from '@material-ui/core';
import DoneIcon from '@material-ui/icons/Done';
import Autocomplete from '@material-ui/lab/Autocomplete';
import { KeyboardDatePicker } from '@material-ui/pickers';
import Big from 'big.js';
import { runInAction } from 'mobx';
import { observer } from 'mobx-react';
import React, { useState } from 'react';
import { useHistory } from 'react-router-dom';

import Scaffold from '../common/Scaffold';
import BackButton from '../common/BackButton';
import { Purchase, useStore } from '../data/store';

export interface PurchaseEditorProps {
  title?: string;
  purchase: Purchase;
  onSave: () => void;
}

const PurchaseEditor: React.FC<PurchaseEditorProps> = observer(props => {
  const { purchase } = props;

  const [initialName] = useState(purchase.product.name);
  const [name, setName] = useState(purchase.product.name);
  const [tags, setTags] = useState(purchase.tagsSortedByName.map(t => t.name));
  const [date, setDate] = useState(purchase.date);
  const [quantity, setQuantity] = useState(purchase.quantity.toString());
  const [price, setPrice] = useState(purchase.price.toString());

  const theme = useTheme();
  const atLeastMedium = useMediaQuery(theme.breakpoints.up('md'));

  const history = useHistory();
  const store = useStore();

  async function save() {
    const [product, tagObjects] = await Promise.all([
      store.addProduct(name),
      store.addTags(tags),
    ]);
    runInAction(() => {
      purchase.product = product;
      purchase.tags = tagObjects;
      purchase.date = date;
      purchase.quantity = new Big(quantity);
      purchase.price = new Big(price);
    });
    props.onSave();
    history.goBack();
  }

  return (
    <Scaffold
      nav={<BackButton />}
      title={props.title ?? 'Edit Purchase'}
      actions={
        <IconButton color='inherit' onClick={save}>
          <DoneIcon />
        </IconButton>
      }
      content={
        <Paper>
          <Box p={2}>
            <FormGroup>
              <Autocomplete
                id='product-autocomplete'
                freeSolo
                options={store.products.map(p => p.name)}
                defaultValue={initialName}
                inputValue={name}
                onInputChange={(e, v) => setName(v ?? '')}
                renderInput={params => (
                  <TextField {...params} label='Product' fullWidth />
                )}
              />
              <KeyboardDatePicker
                label='Purchase Date'
                variant={atLeastMedium ? 'inline' : 'dialog'}
                format='DD.MM.YYYY'
                margin='normal'
                value={date}
                onChange={d => setDate(d ?? purchase.date)}
              />
              <TextField
                label='Price'
                type='number'
                value={price}
                onChange={e => setPrice(e.target.value)}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position='end'>€</InputAdornment>
                  ),
                }}
              />
              <TextField
                label='Quantity'
                type='number'
                value={quantity}
                onChange={e => setQuantity(e.target.value)}
              />
              <Autocomplete
                id='tag-autocomplete'
                multiple
                freeSolo
                options={store.tags.map(t => t.name)}
                value={tags}
                onChange={(e, v) => setTags(v)}
                renderTags={(value, getTagProps) =>
                  value.map((tag, index) => (
                    <Chip label={tag} {...getTagProps({ index })} />
                  ))
                }
                renderInput={params => (
                  <TextField
                    {...params}
                    label='Tags'
                    placeholder='Add Tag'
                    fullWidth
                  />
                )}
              />
            </FormGroup>
          </Box>
        </Paper>
      }
    />
  );
});

export default PurchaseEditor;
