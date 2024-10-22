import { useState } from 'react'
import {
  Card,
  CardContent,
} from '../shadcn'
import { Plus } from 'lucide-react'

export function ConnectionCard({
  logo,
  name,
}: {
  logo: string
  name: string
}) {
  const [isHovered, setIsHovered] = useState(false)

  return (
    <Card
      className="w-[120px] h-[120px] p-0 relative cursor-pointer border border-gray-300 rounded-lg bg-white transition-colors duration-300 ease-in-out hover:bg-[#F8F7FF] hover:border-[#8A7DFF]"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <CardContent className="flex flex-col justify-center items-center h-full pt-6">
        {isHovered ? (
          <div className="flex flex-col justify-center items-center h-full">
            <Plus color="#8A7DFF" size={24} />
            <span className="text-[#8A7DFF] font-semibold text-[14px] font-sans mt-2">Add</span> {/* Set to 14px and semibold */}
          </div>
        ) : (
          <div className="flex flex-col justify-center items-center h-full">
            <img src={logo} alt={`${name} logo`} className="w-8 h-8" style={{ marginBottom: '10px' }} /> {/* 32x32 logo with 10px padding */}
            <p className="m-0 text-sm font-semibold font-sans text-center mb-2">{name}</p> {/* Changed to font-semibold */}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
