import { Redirect, useLocalSearchParams } from 'expo-router';

export default function BB1Product() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <Redirect href={{ pathname: '/product/[id]', params: { id } }} /> as any;
}
