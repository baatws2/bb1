import { Redirect } from 'expo-router';

export default function BB1Root() {
  // Redirect '/bb1' to the actual app root '/'
  return <Redirect href="/" />;
}
