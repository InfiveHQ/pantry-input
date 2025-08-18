import { useMemo } from 'react';
import { getRooms, getStorageAreasByRoom } from '../lib/storageAreas';

interface RoomBasedStorageSelectorProps {
	selectedRoom?: string;
	selectedStorageArea?: string;
	onRoomChange: (room: string) => void;
	onStorageAreaChange: (storageArea: string) => void;
	className?: string;
}

export default function RoomBasedStorageSelector({
	selectedRoom,
	selectedStorageArea,
	onRoomChange,
	onStorageAreaChange,
	className = ''
}: RoomBasedStorageSelectorProps) {
	const rooms = getRooms();

	const activeRoom = selectedRoom || '';

	const areasForActiveRoom = activeRoom ? getStorageAreasByRoom(activeRoom) : [];
	
	console.log('RoomBasedStorageSelector render:', { 
		selectedRoom, 
		activeRoom, 
		areasForActiveRoomLength: areasForActiveRoom.length,
		areasForActiveRoom 
	});

	return (
		<div className={`room-storage-tabs ${className}`}>
			{/* Room Tabs */}
			<div style={{
				display: 'flex',
				gap: 6,
				flexWrap: 'nowrap',
				overflowX: 'auto',
				paddingBottom: 6,
				borderBottom: '1px solid var(--border)',
				marginBottom: 10
			}}>
				{/* All Items tab */}
				<button
					onClick={() => { onRoomChange(''); onStorageAreaChange(''); }}
					style={{
						whiteSpace: 'nowrap',
						background: !activeRoom ? 'var(--primary)' : 'transparent',
						color: !activeRoom ? 'white' : 'var(--text-secondary)',
						padding: '8px 12px',
						border: 'none',
						borderBottom: !activeRoom ? '2px solid var(--primary)' : '2px solid transparent',
						cursor: 'pointer',
						fontSize: 13,
						fontWeight: !activeRoom ? 'bold' : 'normal',
						borderRadius: 4
					}}
				>
					All Items
				</button>
				{rooms.map(room => {
					const isActive = activeRoom === room;
					return (
						<button
							key={room}
							onClick={() => { 
								console.log('Clicking room:', room);
								onRoomChange(room); 
								onStorageAreaChange(''); 
							}}
							style={{
								whiteSpace: 'nowrap',
								background: isActive ? 'var(--primary)' : 'transparent',
								color: isActive ? 'white' : 'var(--text-secondary)',
								padding: '8px 12px',
								border: 'none',
								borderBottom: isActive ? '2px solid var(--primary)' : '2px solid transparent',
								cursor: 'pointer',
								fontSize: 13,
								fontWeight: isActive ? 'bold' : 'normal',
								borderRadius: 4
							}}
						>
							{room}
						</button>
					);
				})}
			</div>

			{/* Storage areas for the active room */}
			{activeRoom && (
				<div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
					<button
						onClick={() => onStorageAreaChange('')}
						style={{
							background: selectedStorageArea === '' ? 'var(--primary)' : 'var(--stats-card-bg)',
							color: selectedStorageArea === '' ? 'white' : 'var(--text-secondary)',
							padding: '6px 10px',
							borderRadius: 16,
							border: selectedStorageArea === '' ? 'none' : '1px solid var(--border)',
							cursor: 'pointer',
							fontSize: 12,
							fontWeight: selectedStorageArea === '' ? 'bold' : 'normal'
						}}
					>
						All {activeRoom}
					</button>
					{areasForActiveRoom.map(area => {
						const isActive = selectedStorageArea === area.name;
						return (
							<button
								key={area.id}
								onClick={() => onStorageAreaChange(area.name)}
								style={{
									background: isActive ? 'var(--primary)' : 'var(--stats-card-bg)',
									color: isActive ? 'white' : 'var(--text-secondary)',
									padding: '6px 10px',
									borderRadius: 16,
									border: isActive ? 'none' : '1px solid var(--border)',
									cursor: 'pointer',
									fontSize: 12,
									fontWeight: isActive ? 'bold' : 'normal'
								}}
							>
								{area.name}
							</button>
						);
					})}
				</div>
			)}
		</div>
	);
}
