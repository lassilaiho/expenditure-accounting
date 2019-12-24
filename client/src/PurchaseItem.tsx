import {
  Box,
  Button,
  Chip,
  Divider,
  ExpansionPanel,
  ExpansionPanelActions,
  ExpansionPanelDetails,
  ExpansionPanelSummary,
  Typography
} from '@material-ui/core';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import React from 'react';

import { Purchase } from './data/store';
import { currency, formatDate, threeDecimals } from './util';

export interface PurchaseListItemProps {
  purchase: Purchase;
  expanded: boolean;
  onToggle: () => void;
  onEdit: (purchase: Purchase) => void;
}

const PurchaseItem: React.FC<PurchaseListItemProps> = props => {
  const { purchase: p, expanded, onToggle } = props;
  let quantity = '';
  if (p.quantity !== 1) {
    if (Number.isInteger(p.quantity)) {
      quantity = `${p.quantity.toFixed(0)} × `;
    } else {
      quantity = `${threeDecimals.format(p.quantity)} × `;
    }
  }

  function onEdit(e: React.MouseEvent<HTMLButtonElement, MouseEvent>) {
    e.stopPropagation();
    props.onEdit(p);
  }

  return (
    <ExpansionPanel
      expanded={expanded}
      onClick={onToggle}
      TransitionProps={{ unmountOnExit: true }}
    >
      <ExpansionPanelSummary expandIcon={<ExpandMoreIcon />}>
        <Box>
          <Typography>{quantity + p.product.name}</Typography>
          <Typography color='textSecondary'>
            {`${formatDate(p.date)} • ${currency.format(p.totalPrice)}`}
          </Typography>
        </Box>
      </ExpansionPanelSummary>
      <ExpansionPanelDetails>
        <Box display='flex' flexWrap='wrap'>
          {p.tagsSortedByName.map(t => (
            <Box m={1} key={t.id}>
              <Chip label={t.name} />
            </Box>
          ))}
        </Box>
      </ExpansionPanelDetails>
      <Divider />
      <ExpansionPanelActions>
        <Button size='small' color='primary' onClick={onEdit}>
          Edit
        </Button>
      </ExpansionPanelActions>
    </ExpansionPanel>
  );
};

export default PurchaseItem;
