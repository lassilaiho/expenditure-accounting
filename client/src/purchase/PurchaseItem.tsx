import {
  Box,
  Button,
  Chip,
  Divider,
  Accordion,
  AccordionActions,
  AccordionDetails,
  AccordionSummary,
  Typography,
} from '@material-ui/core';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import React from 'react';

import {
  getProductById,
  getTagsSortedByName,
  Purchase,
  totalPrice,
  useAppSelector,
} from '../data/store';
import { currency, numOfBig, threeDecimals } from '../util';

export interface PurchaseListItemProps {
  purchase: Purchase;
  expanded: boolean;
  onToggle: () => void;
  onEdit: (purchase: Purchase) => void;
  onDelete: (purchase: Purchase) => void;
}

const PurchaseItem: React.FC<PurchaseListItemProps> = props => {
  const { purchase: p, expanded, onToggle } = props;
  const product = useAppSelector(getProductById(p.product));
  const tags = useAppSelector(getTagsSortedByName(p.tags));

  let quantity = '';
  if (!p.quantity.eq(1)) {
    if (p.quantity.round(0).eq(p.quantity)) {
      quantity = `${p.quantity.toFixed(0)} × `;
    } else {
      quantity = `${threeDecimals.format(numOfBig(p.quantity))} × `;
    }
  }

  function onEdit(e: React.MouseEvent<HTMLButtonElement, MouseEvent>) {
    e.stopPropagation();
    props.onEdit(p);
  }

  function onDelete(e: React.MouseEvent<HTMLButtonElement, MouseEvent>) {
    e.stopPropagation();
    props.onDelete(p);
  }

  const formattedPrice = currency.format(numOfBig(totalPrice(p)));

  return (
    <Accordion
      expanded={expanded}
      onClick={onToggle}
      TransitionProps={{ unmountOnExit: true }}
    >
      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
        <Box>
          <Typography>{quantity + product.name}</Typography>
          <Typography color='textSecondary'>
            {`${p.date.format('D.M.YYYY')} • ${formattedPrice}`}
          </Typography>
        </Box>
      </AccordionSummary>
      <AccordionDetails>
        <Box display='flex' flexWrap='wrap'>
          {tags.map(t => (
            <Box m={1} key={t.id}>
              <Chip label={t.name} />
            </Box>
          ))}
        </Box>
      </AccordionDetails>
      <Divider />
      <AccordionActions>
        <Button size='small' color='primary' onClick={onDelete}>
          Delete
        </Button>
        <Button size='small' color='primary' onClick={onEdit}>
          Edit
        </Button>
      </AccordionActions>
    </Accordion>
  );
};

export default PurchaseItem;
