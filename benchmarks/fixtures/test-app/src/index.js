import { render } from './components/App';
import { formatDate, calculateTotal } from './utils/helpers';
import { Button } from './components/Button';
import { Card } from './components/Card';
import { Modal } from './components/Modal';
import { Form } from './components/Form';
import { List } from './components/List';

const app = document.getElementById('app');

const data = {
  title: 'Benchmark Test App',
  items: [
    { id: 1, name: 'Item 1', price: 10.99 },
    { id: 2, name: 'Item 2', price: 20.99 },
    { id: 3, name: 'Item 3', price: 30.99 },
  ],
  date: new Date(),
};

const total = calculateTotal(data.items.map(i => i.price));
const formattedDate = formatDate(data.date);

console.log(`Total: ${total}, Date: ${formattedDate}`);

render(app, {
  ...data,
  Button,
  Card,
  Modal,
  Form,
  List,
});
