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
import { Autocomplete, AutocompleteChangeReason } from '@material-ui/lab';
import { KeyboardDatePicker } from '@material-ui/pickers';
import Big from 'big.js';
import React, {
  ChangeEvent,
  KeyboardEvent,
  useEffect,
  useRef,
  useState,
} from 'react';

import Scaffold from '../common/Scaffold';
import BackButton from '../common/BackButton';
import { useAppSelector, useAppStore } from '../data/store';
import { getProductById, getProducts } from '../data/products';
import {
  Purchase,
  PurchaseUpdate,
  getLatestPurchaseByProduct,
} from '../data/purchases';
import { getTagsSortedByName, getTags } from '../data/tags';
import { useRouting } from '../data/ui';

export interface PurchaseEditorProps {
  title?: string;
  purchase: Purchase;
  onSave: (update: PurchaseUpdate) => void;
}

const PurchaseEditor: React.FC<PurchaseEditorProps> = props => {
  const { purchase } = props;
  const product = useAppSelector(getProductById(purchase.product));
  const existingTags = useAppSelector(getTagsSortedByName(purchase.tags));
  const allProducts = useAppSelector(getProducts);
  const allTags = useAppSelector(getTags);

  const [initialName] = useState(product?.name ?? '');
  const [name, setName] = useState(initialName);
  const [tags, setTags] = useState(existingTags.map(x => x.name));
  const [date, setDate] = useState(purchase.date);
  const [quantity, setQuantity] = useState(purchase.quantity.toString());
  const [price, setPrice] = useState(purchase.price.toString());

  const theme = useTheme();
  const atLeastMedium = useMediaQuery(theme.breakpoints.up('md'));

  const nameInputRef = useRef<HTMLElement>(null);
  useEffect(() => nameInputRef.current?.focus(), []);

  const routing = useRouting();
  const store = useAppStore();

  function save() {
    props.onSave({
      id: purchase.id,
      product: name,
      date,
      quantity: new Big(quantity),
      price: new Big(price),
      tags,
    });
    routing.pop();
  }

  function prefillFields(
    event: ChangeEvent<unknown>,
    value: string | null,
    reason: AutocompleteChangeReason,
  ) {
    if (
      !value ||
      reason !== 'select-option' ||
      (tags.length && price && quantity)
    ) {
      return;
    }
    const state = store.getState();
    const latest = getLatestPurchaseByProduct(value)(state);
    if (latest) {
      if (tags.length === 0) {
        const tags = getTagsSortedByName(latest.tags)(state);
        setTags(tags.map(t => t.name));
      }
      if (!price || price === '1') {
        setPrice(latest.price.valueOf());
      }
      if (!quantity || quantity === '1') {
        setQuantity(latest.quantity.valueOf());
      }
    }
  }

  function onCtrlEnter(e: KeyboardEvent) {
    if (!e.defaultPrevented && e.key === 'Enter' && e.ctrlKey) {
      save();
    }
  }

  return (
    <Scaffold
      onKeyDown={onCtrlEnter}
      nav={<BackButton onClick={routing.pop} />}
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
                options={allProducts.map(x => x.name)}
                defaultValue={initialName}
                inputValue={name}
                onChange={prefillFields}
                onInputChange={(e, v) => setName(v ?? '')}
                renderInput={params => (
                  <TextField
                    {...params}
                    inputRef={nameInputRef}
                    label='Product'
                    fullWidth
                  />
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
                options={allTags.map(x => x.name)}
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
};

export default PurchaseEditor;
