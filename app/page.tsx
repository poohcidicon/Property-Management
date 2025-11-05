"use client"

import { useEffect, useState } from 'react';
import PropertyLayout from "../app/property-layout/page"

// interface HomePageProps {
//   params: { id: string }; // Type the `id` parameter as a string
//   searchParams: Promise<{ 
//     p: string;
//     type: string;
//   }>; // Search params are optional
// }

const types = ['market', 'hotel']
export default function HomePage() {
  // ใส่ Default
  // const typeBusiness = (await searchParams).type || 'market';
  // const typeBusiness = 'market'
  // const projectId = (await searchParams).p || 'M004'
  // const projectId = 'M004'
  const [typeBusiness, setTypeBusiness] = useState<string | null>()
  const [projectId, setProjectId] = useState<string | null>()
  const [initMonth, setInitMonth] = useState<string | null>()
  const [initYear, setInitYear] = useState<string | null>()
  const [initZone, setInitZone] = useState<string | null>()

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const selectTypeBusiness = params.get('type');
    const selectProject = params.get('p')
    const selectInitMonth = params.get('month')
    const selectInitYear = params.get('year')
    const selectInitZone = params.get('zone')
    setTypeBusiness(selectTypeBusiness || 'market')
    setProjectId(selectProject || 'M004')
    setInitYear(selectInitYear)
    setInitMonth(selectInitMonth)
    setInitZone(selectInitZone)
  }, [])

  if (typeof typeBusiness === 'string' && types.includes(typeBusiness) && projectId) {
    return <PropertyLayout typeBusiness={typeBusiness} projectId={projectId} initMonth={initMonth} initYear={initYear} initZone={initZone}/>
  }

  
  return <></>
}