import {
  getJuzgados,
  getFiscalias,
  getTiposProceso,
} from './actions';
import { CatalogsPageClient } from './components/catalogs-page-client';

export default async function LegalCatalogsPage() {
  const [juzgados, fiscalias, tiposProceso] = await Promise.all([
    getJuzgados(),
    getFiscalias(),
    getTiposProceso(),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          Catálogos de Guatemala
        </h1>
        <p className="text-gray-600 mt-1">
          Explora los juzgados, fiscalías y tipos de proceso disponibles en el
          sistema
        </p>
      </div>

      <CatalogsPageClient
        juzgados={juzgados}
        fiscalias={fiscalias}
        tiposProceso={tiposProceso}
      />
    </div>
  );
}