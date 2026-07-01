import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Ticket } from 'lucide-react';
import { getMyPasses } from '../../api/passes';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Spinner from '../../components/ui/Spinner';
import EmptyState from '../../components/ui/EmptyState';
import { formatDate, getErrorMessage } from '../../utils/format';

export default function MyPassesPage() {
  const [passes, setPasses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await getMyPasses();
        setPasses(res.data.data.passes);
      } catch (err) {
        toast.error(getErrorMessage(err));
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">My passes</h1>
        <p className="text-sm text-slate-500">Passes generated for your approved visit requests.</p>
      </div>

      {loading ? (
        <Spinner />
      ) : passes.length === 0 ? (
        <EmptyState
          icon={Ticket}
          title="No passes yet"
          description="Once your appointment is approved and a pass is generated, it will show up here."
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {passes.map((pass) => {
            const appointment = pass.appointmentId;
            return (
              <Link key={pass._id} to={`/passes/${pass._id}`}>
                <Card className="flex flex-col items-center gap-3 text-center transition-shadow hover:shadow-md">
                  {pass.qrCode && (
                    <img src={pass.qrCode} alt="QR code" className="h-32 w-32 rounded-lg border border-slate-200 p-1" />
                  )}
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{pass.passNumber}</p>
                    <p className="text-xs text-slate-500">{appointment?.purpose}</p>
                    <p className="text-xs text-slate-400">{formatDate(appointment?.visitDate)}</p>
                  </div>
                  <Badge status={pass.status} />
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
