import { toast } from 'react-toastify';

export function notify_error(err: string) {
    toast.error(err);
}
