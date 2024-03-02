import { Button } from '@nextui-org/react'
import React from 'react'
import { MdAdd } from 'react-icons/md'

interface Props {
    handleFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void
}

const Settings = ({ handleFileChange }: Props) => {

    return (
        <div className="flex justify-between flex-wrap gap-4 p-4">
            <input
                hidden
                id='videoUpload'
                type="file"
                accept="video/*"
                onChange={handleFileChange} />
            <Button variant="light">
                <label htmlFor="videoUpload" className="flex gap-2 p-4 items-center justify-center cursor-pointer">
                    <MdAdd className="w-6 h-6 md:w-8 md:h-8" />
                    <span>Upload</span>
                </label>
            </Button>
        </div>
    )
}

export default Settings