import {
    Card,
    CardBody,
    Typography,
    Button,
    Dialog,
    DialogHeader,
    DialogBody,
    DialogFooter,
    Input,
    IconButton,
    Select,
    Option,
  } from "@material-tailwind/react";
  import { PlusIcon, EyeIcon, TrashIcon } from "@heroicons/react/24/solid";
  import { useState, useEffect } from "react";
  import axios from "../../utils/axiosConfig";
  import Swal from 'sweetalert2';
  
  // Configuración de Toast
  const Toast = Swal.mixin({
    toast: true,
    position: "top-end",
    showConfirmButton: false,
    timer: 3000,
    timerProgressBar: true,
    didOpen: (toast) => {
        toast.onmouseenter = Swal.stopTimer;
        toast.onmouseleave = Swal.resumeTimer;
    }
  });
  
  export function Compras() {
    const [compras, setCompras] = useState([]);
    const [filteredCompras, setFilteredCompras] = useState([]);
    const [open, setOpen] = useState(false);
    const [detailsOpen, setDetailsOpen] = useState(false);
    const [cancelOpen, setCancelOpen] = useState(false); // Estado para controlar el modal de anulación
    const [proveedores, setProveedores] = useState([]);
    const [insumos, setInsumos] = useState([]);
    const [selectedCompra, setSelectedCompra] = useState({
        id_proveedor: "",
        fecha_compra: "",
        fecha_registro: "",
        estado: "Completado",
        detalleCompras: [],
        proveedorCompra: { nombre: "", contacto: "" },
        detalleComprasCompra: [],
        total: 0,
        subtotal: 0,
    });
    const [currentPage, setCurrentPage] = useState(1);
    const [comprasPerPage] = useState(4);
    const [search, setSearch] = useState("");
    const [errors, setErrors] = useState({});
    const [motivoAnulacion, setMotivoAnulacion] = useState(''); // Estado para el motivo de anulación
    const [compraToCancel, setCompraToCancel] = useState(null); // Estado para la compra a cancelar
  
    useEffect(() => {
        fetchCompras();
        fetchProveedores();
        fetchInsumos();
    }, []);
  
    const fetchCompras = async () => {
        try {
            const response = await axios.get("http://localhost:3000/api/compras");
            setCompras(response.data);
            setFilteredCompras(response.data);
        } catch (error) {
            console.error("Error fetching compras:", error);
        }
    };
  
    const fetchProveedores = async () => {
        try {
            const response = await axios.get("http://localhost:3000/api/proveedores");
            setProveedores(response.data);
        } catch (error) {
            console.error("Error fetching proveedores:", error);
        }
    };
  
    const fetchInsumos = async () => {
        try {
            const response = await axios.get("http://localhost:3000/api/insumos");
            setInsumos(response.data);
        } catch (error) {
            console.error("Error fetching insumos:", error);
        }
    };
  
    useEffect(() => {
        filterCompras();
    }, [search, compras]);
  
    const filterCompras = () => {
        const filtered = compras.filter((compra) =>
            compra.proveedorCompra?.nombre?.toLowerCase().includes(search.toLowerCase())
        );
        setFilteredCompras(filtered);
    };
  
    const handleOpen = () => setOpen(!open);
    const handleDetailsOpen = () => setDetailsOpen(!detailsOpen);
  
    const handleCreate = () => {
        setSelectedCompra({
            id_proveedor: "",
            fecha_compra: "",
            fecha_registro: "",
            estado: "Completado",
            detalleCompras: [],
            proveedorCompra: { nombre: "", contacto: "" },
            detalleComprasCompra: [],
            total: 0,
            subtotal: 0,
        });
        setErrors({});
        handleOpen();
    };
  
    const validateForm = () => {
        const newErrors = {};
  
        if (!selectedCompra.id_proveedor) {
            newErrors.id_proveedor = "El proveedor es obligatorio";
        }
        if (!selectedCompra.fecha_compra) {
            newErrors.fecha_compra = "La fecha de compra es obligatoria";
        }
        if (!selectedCompra.fecha_registro) {
            newErrors.fecha_registro = "La fecha de registro es obligatoria";
        }
        if (selectedCompra.detalleCompras.length === 0) {
            newErrors.detalleCompras = "Debe agregar al menos un detalle de compra";
        }
        selectedCompra.detalleCompras.forEach((detalle, index) => {
            if (!detalle.id_insumo) {
                newErrors[`insumo_${index}`] = "El insumo es obligatorio";
            }
            if (!detalle.cantidad || detalle.cantidad <= 0) {
                newErrors[`cantidad_${index}`] = "La cantidad debe ser mayor a 0";
            }
            if (!detalle.precio_unitario || detalle.precio_unitario <= 0) {
                newErrors[`precio_${index}`] = "El precio unitario debe ser mayor a 0";
            }
        });
  
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };
  
    const handleSave = async () => {
        if (!validateForm()) {
            Toast.fire({
                icon: 'error',
                title: 'Por favor, corrija los errores en el formulario.'
            });
            return;
        }
  
        // Validación de insumos duplicados
        const insumosSeleccionados = selectedCompra.detalleCompras.map(detalle => detalle.id_insumo);
        const insumosUnicos = new Set(insumosSeleccionados);
        if (insumosSeleccionados.length !== insumosUnicos.size) {
            Toast.fire({
                icon: 'error',
                title: 'No se pueden seleccionar insumos duplicados.'
            });
            return;
        }
  
        const compraToSave = {
            id_proveedor: parseInt(selectedCompra.id_proveedor),
            fecha_compra: selectedCompra.fecha_compra,
            fecha_registro: selectedCompra.fecha_registro,
            estado: selectedCompra.estado,
            total: selectedCompra.total,
            detalleCompras: selectedCompra.detalleCompras.map(detalle => ({
                id_insumo: parseInt(detalle.id_insumo),
                cantidad: parseInt(detalle.cantidad),
                precio_unitario: parseFloat(detalle.precio_unitario)
            }))
        };
  
        try {
            await axios.post("http://localhost:3000/api/compras", compraToSave);
            Toast.fire({
                icon: 'success',
                title: 'La compra ha sido creada correctamente.'
            });
            fetchCompras();
            handleOpen();
        } catch (error) {
            console.error("Error saving compra:", error);
            Toast.fire({
                icon: 'error',
                title: 'Hubo un problema al guardar la compra.'
            });
        }
    };
  
    const handleChange = (e) => {
        const { name, value } = e.target;
        setSelectedCompra({ ...selectedCompra, [name]: value });
        setErrors({ ...errors, [name]: '' });
    };
  
    const handleDetalleChange = (index, e) => {
        const { name, value } = e.target;
        const detalles = [...selectedCompra.detalleCompras];
  
        if (name === "cantidad") {
            detalles[index][name] = value.replace(/\D/, ""); // Solo permite dígitos
        } else if (name === "precio_unitario") {
            detalles[index][name] = value.replace(/[^\d.]/, ""); // Permite dígitos y un punto decimal
        } else {
            detalles[index][name] = value;
        }
  
        setSelectedCompra({ ...selectedCompra, detalleCompras: detalles });
        setErrors({ ...errors, [`${name}_${index}`]: '' });
        updateTotal(detalles);
    };
  
    const handleAddDetalle = () => {
        setSelectedCompra({
            ...selectedCompra,
            detalleCompras: [...selectedCompra.detalleCompras, { id_insumo: "", cantidad: "", precio_unitario: "" }]
        });
    };
  
    const handleRemoveDetalle = (index) => {
        const detalles = [...selectedCompra.detalleCompras];
        detalles.splice(index, 1);
        setSelectedCompra({ ...selectedCompra, detalleCompras: detalles });
        updateTotal(detalles);
    };
  
    const updateTotal = (detalles) => {
        const subtotal = detalles.reduce((acc, detalle) => acc + (parseFloat(detalle.precio_unitario) || 0) * (parseInt(detalle.cantidad) || 0), 0);
        const total = subtotal * 1.19;
        setSelectedCompra(prevState => ({
            ...prevState,
            total,
            subtotal
        }));
    };
  
    const handleSearchChange = (e) => {
        setSearch(e.target.value);
    };
  
    const handleViewDetails = (compra) => {
        setSelectedCompra({
            ...compra,
            detalleCompras: compra.detalleComprasCompra || [],
            proveedorCompra: compra.proveedorCompra || { nombre: "", contacto: "" },
            fecha_compra: compra.fecha_compra.split('T')[0],
            fecha_registro: compra.fecha_registro.split('T')[0],
            subtotal: parseFloat(compra.total) || 0,
            total: (parseFloat(compra.total) || 0) * 1.19
        });
        handleDetailsOpen();
    };
  
    const toggleActivo = async (id_compra, activo) => {
        const compra = compras.find(c => c.id_compra === id_compra);
        if (!compra) {
            Toast.fire({
                icon: 'error',
                title: 'Compra no encontrada.',
            });
            return;
        }
    
        if (!activo && compra.anulacion) { // Verifica si la compra ya ha sido anulada
            Toast.fire({
                icon: 'error',
                title: 'No se puede reactivar una compra anulada.',
            });
            return;
        }
    
        if (!activo) { // Si se está intentando activar la compra
            try {
                await axios.patch(`http://localhost:3000/api/compras/${id_compra}/estado`, { activo: true });
                fetchCompras();
                Toast.fire({
                    icon: 'success',
                    title: 'La compra ha sido activada correctamente.',
                });
            } catch (error) {
                console.error("Error al cambiar el estado de la compra:", error.response?.data || error.message);
                Toast.fire({
                    icon: 'error',
                    title: 'Hubo un problema al cambiar el estado de la compra.',
                });
            }
        } else {
            // Si se está intentando desactivar, abrimos el modal de anulación
            setCompraToCancel(id_compra);
            setCancelOpen(true);
        }
    };
    
  
    const handleCancelCompra = async () => {
        if (!motivoAnulacion.trim()) {
          Toast.fire({
            icon: 'error',
            title: 'Debe proporcionar un motivo de anulación.',
          });
          return;
        }
      
        try {
          await axios.patch(`http://localhost:3000/api/compras/${compraToCancel}/estado`, { 
            activo: false, 
            anulacion: motivoAnulacion 
          });
          fetchCompras();
          Toast.fire({
            icon: 'success',
            title: 'La compra ha sido anulada correctamente.',
          });
          setCancelOpen(false);
          setMotivoAnulacion('');
        } catch (error) {
          console.error("Error al anular la compra:", error.response?.data || error.message);
          Toast.fire({
            icon: 'error',
            title: `Hubo un problema al anular la compra: ${error.response?.data?.error || error.message}`,
          });
        }
      };
  
    const getInsumoName = (id_insumo) => {
        const insumo = insumos.find((ins) => ins.id_insumo === id_insumo);
        return insumo ? insumo.nombre : "Desconocido";
    };
  
    const indexOfLastCompra = currentPage * comprasPerPage;
    const indexOfFirstCompra = indexOfLastCompra - comprasPerPage;
    const currentCompras = filteredCompras.slice(indexOfFirstCompra, indexOfLastCompra);
  
    const pageNumbers = [];
    for (let i = 1; i <= Math.ceil(filteredCompras.length / comprasPerPage); i++) {
        pageNumbers.push(i);
    }
  
    const paginate = (pageNumber) => setCurrentPage(pageNumber);
  
    return (
        <>
            <div className="relative mt-2 h-32 w-full overflow-hidden rounded-xl bg-[url('/img/background-image.png')] bg-cover bg-center">
                <div className="absolute inset-0 h-full w-full bg-gray-900/75" />
            </div>
            <Card className="mx-2 -mt-16 mb-6 lg:mx-4 border border-blue-gray-100">
            <CardBody className="p-4">
    <Button onClick={handleCreate} className="btnagregar" size="sm" startIcon={<PlusIcon />}>
        Crear Compra
    </Button>
    <div className="mb-6">
        <Input
            type="text"
            placeholder="Buscar por proveedor..."
            value={search}
            onChange={handleSearchChange}
        />
    </div>
    <div className="mb-1">
        <Typography variant="h6" color="blue-gray" className="mb-4">
            Lista de Compras
        </Typography>
        <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                    <tr>
                        <th className="py-2 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Proveedor
                            </th>
                        <th className="py-2 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Fecha de Compra</th>
                        <th className="py-2 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Fecha de Registro</th>
                        <th className="py-2 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Estado</th>
                        <th className="py-2 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Subtotal</th>
                        <th className="py-2 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Total</th>
                        <th className="py-2 px-4text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Acciones</th>
                    </tr>
                </thead>
                <tbody>
                    {currentCompras.map((compra) => (
                        <tr key={compra.id_compra} className="border-b">
                            <td className="py-2 px-4">{compra.proveedorCompra?.nombre || "Desconocido"}</td>
                            <td className="py-2 px-4">{compra.fecha_compra.split('T')[0]}</td>
                            <td className="py-2 px-4">{compra.fecha_registro.split('T')[0]}</td>
                            <td className="py-2 px-4">{compra.estado}</td>
                            <td className="py-2 px-4">${(parseFloat(compra.total) / 1.19).toFixed(2)}</td>
                            <td className="py-2 px-4">${parseFloat(compra.total).toFixed(2)}</td>
                            <td className="py-2 px-4 flex gap-2">
                                <IconButton className="btnvisualizar" size="sm" onClick={() => handleViewDetails(compra)} disabled={!compra.activo}>
                                    <EyeIcon className="h-5 w-5" />
                                </IconButton>
                                
                                <label className="inline-flex relative items-center cursor-pointer">
    <input
        type="checkbox"
        className="sr-only peer"
        checked={compra.activo}
        onChange={() => toggleActivo(compra.id_compra, compra.activo)}
    />
    <div
        className={`relative inline-flex items-center cursor-pointer transition-transform duration-300 ease-in-out h-6 w-12 rounded-full focus:outline-none ${
            compra.activo
                ? 'bg-gradient-to-r from-green-800 to-green-600 hover:from-green-600 hover:to-green-400 shadow-lg transform scale-105'
                : 'bg-gradient-to-r from-red-800 to-red-500 hover:from-red-600 hover:to-red-400 shadow-lg transform scale-105'
        }`}
    >
        <span
            className={`transition-transform duration-300 ease-in-out ${
                compra.activo ? 'translate-x-6' : 'translate-x-1'
            } inline-block w-5 h-5 transform bg-white rounded-full shadow-md`}
        />
    </div>
    <span
        className={`absolute left-1 flex items-center text-xs text-white font-semibold ${
            compra.activo ? 'opacity-0' : 'opacity-100'
        }`}
    >
        Off
    </span>
    <span
        className={`absolute right-1 flex items-center text-xs text-white font-semibold ${
            compra.activo ? 'opacity-100' : 'opacity-0'
        }`}
    >
        On
    </span>
</label>
      </td>
         </tr>
                    ))}
                </tbody>
            </table>
        </div>
        <div className="mt-4">
            <ul className="flex justify-center items-center space-x-2">
                {pageNumbers.map((number) => (
                    <Button
                        key={number}
                        onClick={() => paginate(number)}
                        className={`pagination ${number === currentPage ? 'active' : ''}`}
                        size="sm"
                    >
                        {number}
                    </Button>
                ))}
            </ul>
        </div>
    </div>
</CardBody>
</Card>
  
            <Dialog open={open} handler={handleOpen} className="custom-modal">
                <DialogHeader className="text-black p-1">Crear Compra</DialogHeader>
                <DialogBody divider className="overflow-auto max-h-[60vh] p-4 flex gap-6">
                    <div className="flex-1 flex flex-col gap-4">
                        <div className="w-[200px]">
                            <Select
                                label="Proveedor"
                                name="id_proveedor"
                                value={selectedCompra.id_proveedor}
                                onChange={(e) => {
                                    setSelectedCompra({ ...selectedCompra, id_proveedor: e });
                                    setErrors({ ...errors, id_proveedor: '' });
                                }}
                                className={`w-full ${errors.id_proveedor ? 'border-red-500' : ''}`}
                                required
                            >
                                {proveedores
                                  .filter(proveedor => proveedor.activo) // Filtra solo proveedores activos
                                  .map((proveedor) => (
                                    <Option key={proveedor.id_proveedor} value={proveedor.id_proveedor}>
                                        {proveedor.nombre}
                                    </Option>
                                ))}
                            </Select>
                            {errors.id_proveedor && <p className="text-red-500 text-xs mt-1">{errors.id_proveedor}</p>}
                        </div>
                        <div className="w-[200px]">
                            <Input
                                label="Fecha de Compra"
                                name="fecha_compra"
                                type="date"
                                value={selectedCompra.fecha_compra}
                                onChange={handleChange}
                                className={`w-full ${errors.fecha_compra ? 'border-red-500' : ''}`}
                                required
                            />
                            {errors.fecha_compra && <p className="text-red-500 text-xs mt-1">{errors.fecha_compra}</p>}
                        </div>
                        <div className="w-[200px]">
                            <Input
                                label="Fecha de Registro"
                                name="fecha_registro"
                                type="date"
                                value={selectedCompra.fecha_registro}
                                onChange={handleChange}
                                className={`w-full ${errors.fecha_registro ? 'border-red-500' : ''}`}
                                required
                            />
                            {errors.fecha_registro && <p className="text-red-500 text-xs mt-1">{errors.fecha_registro}</p>}
                        </div>
                        <Typography variant="h6" color="blue-gray" className="mt-1">
                            Insumos a comprar
                        </Typography>

    <div className="bg-gray-100 p-4 rounded-lg shadow-lg flex-2 overflow-y-auto max-h-[800px]">
    {selectedCompra.detalleCompras.map((detalle, index) => (
        <div key={index} className="mb-4 flex items-center">
            <div className="flex-1 flex flex-col gap-4 mb-2">
                <div className="w-[200px]"> 
                    <Select
                        label="Insumo"
                        name="id_insumo"
                        value={detalle.id_insumo}
                        onChange={(e) => {
                            handleDetalleChange(index, { target: { name: 'id_insumo', value: e } });
                            setErrors({ ...errors, [`insumo_${index}`]: "" });
                        }}
                        className="w-full text-xs" 
                    >
                        {insumos
                          .filter(insumo => insumo.activo) // Filtra solo insumos activos
                          .map((insumo) => (
                            <Option key={insumo.id_insumo} value={insumo.id_insumo}>
                                {insumo.nombre}
                            </Option>
                        ))}
                    </Select>
                    {errors[`insumo_${index}`] && (
                        <p className="text-red-500 text-xs mt-1">{errors[`insumo_${index}`]}</p>
                    )}
                </div>
                <div className="w-[200px]">
                    <Input
                        label="Cantidad"
                        name="cantidad"
                        type="number"
                        required
                        value={detalle.cantidad}
                        onChange={(e) => {
                            handleDetalleChange(index, e);
                            setErrors({ ...errors, [`cantidad_${index}`]: "" });
                        }}
                        className="w-full text-xs" 
                    />
                    {errors[`cantidad_${index}`] && (
                        <p className="text-red-500 text-xs mt-1">{errors[`cantidad_${index}`]}</p>
                    )}
                </div>
                <div className="w-[200px]">
                    <Input
                        label="Precio Unitario"
                        name="precio_unitario"
                        type="number"
                        step="0.01"
                        required
                        value={detalle.precio_unitario}
                        onChange={(e) => {
                            handleDetalleChange(index, e);
                            setErrors({ ...errors, [`precio_${index}`]: "" });
                        }}
                        className="w-full text-xs" 
                    />
                    {errors[`precio_${index}`] && (
                        <p className="text-red-500 text-xs mt-1">{errors[`precio_${index}`]}</p>
                    )}
                </div>
            </div>
            <div className="flex items-center ml-2">
                <IconButton
                    color="red"
                    onClick={() => handleRemoveDetalle(index)}
                    className="btncancelarm"
                    size="sm"
                >
                    <TrashIcon className="h-4 w-4" /> 
                </IconButton>
            </div>
        </div>
    ))}
    <div className="mt-2">
        <Button className="btnmas" size="xs" onClick={handleAddDetalle}> 
            <PlusIcon className="h-4 w-4 mr-0" /> 
        </Button>
    </div>
</div>       
  </div>
     <div className="w-[300px] bg-gray-100 p-4 rounded-lg shadow-lg max-h-[60vh] overflow-y-auto">
                        <Typography variant="h6" color="blue-gray" className="mb-4">
                            Insumos Seleccionados
                        </Typography>
                        <ul className="list-disc pl-4">
                            {selectedCompra.detalleCompras.map((detalle, index) => (
                                <li key={index} className="mb-2">
                                    <span className="font-semibold text-gray-800">
                                        {insumos.find(insumo => insumo.id_insumo === detalle.id_insumo)?.nombre || 'Desconocido'}:
                                    </span>
                                    Cantidad {detalle.cantidad}, Precio Unitario ${parseFloat(detalle.precio_unitario).toFixed(2)}
                                </li>
                            ))}
                        </ul>
                        <div className="mt-4">
                            <Typography variant="h6" color="blue-gray">
                                SubTotal (con IVA 19%): ${selectedCompra.total.toFixed(2)}
                            </Typography>
                            <Typography variant="h6" color="blue-gray">
                                Total: ${selectedCompra.total.toFixed(2)}
                            </Typography>
                        </div>
                    </div>
                </DialogBody>
                <DialogFooter className="bg-white p-4 flex justify-end gap-2">
                    <Button variant="text" className="btncancelarm" size="sm" onClick={handleOpen}>
                        Cancelar
                    </Button>
                    <Button variant="gradient" className="btnagregarm" size="sm" onClick={handleSave}>
                        Crear Compra
                    </Button>
                </DialogFooter>
            </Dialog>
  
            <Dialog open={detailsOpen} handler={handleDetailsOpen} className="overflow-auto max-h-[90vh] rounded-lg shadow-lg border border-gray-200">
    <DialogHeader className="font-bold text-gray-900">
        <Typography variant="h4" className="font-semibold">
            Detalles de la Compra
        </Typography>
    </DialogHeader>
    <DialogBody divider className="overflow-auto max-h-[60vh] p-4 bg-white">
        {selectedCompra.proveedorCompra && (
            <div className="mb-2">
                <Typography variant="h5" color="blue-gray" className="mb-1">
                    Información del Proveedor
                </Typography>
                <table className="min-w-full border-separate border-spacing-1 border-gray-300">
                    <tbody>
                        <tr className="border-b border-gray-300">
                            <td className="font-semibold px-4 py-2">ID Proveedor:</td>
                            <td className="px-4 py-2">{selectedCompra.proveedorCompra.id_proveedor}</td>
                        </tr>
                        <tr className="border-b border-gray-300">
                            <td className="font-semibold px-4 py-2">Nombre:</td>
                            <td className="px-4 py-2">{selectedCompra.proveedorCompra.nombre}</td>
                        </tr>
                        <tr className="border-b border-gray-300">
                            <td className="font-semibold px-4 py-2">Contacto:</td>
                            <td className="px-4 py-2">{selectedCompra.proveedorCompra.contacto}</td>
                        </tr>
                        <tr className="border-b border-gray-300">
                            <td className="font-semibold px-4 py-2">Creado:</td>
                            <td className="px-4 py-2">{new Date(selectedCompra.proveedorCompra.createdAt).toLocaleString()}</td>
                        </tr>
                        <tr>
                            <td className="font-semibold px-4 py-2">Actualizado:</td>
                            <td className="px-4 py-2">{new Date(selectedCompra.proveedorCompra.updatedAt).toLocaleString()}</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        )}
        <div className="mt-6">
            <Typography variant="h5" color="blue-gray" className="mb-3">
                Detalles de la Compra
            </Typography>
            <table className="min-w-full border-separate border-spacing-2 border-gray-300">
                <thead className="bg-gray-200">
                    <tr>
                        <th className="px-4 py-2 text-left font-semibold text-gray-700">ID de Compra</th>
                        <th className="px-4 py-2 text-left font-semibold text-gray-700">Nombre Insumo</th>
                        <th className="px-4 py-2 text-left font-semibold text-gray-700">Cantidad</th>
                        <th className="px-4 py-2 text-left font-semibold text-gray-700">Precio Unitario</th>
                    </tr>
                </thead>
                <tbody>
                    {selectedCompra.detalleCompras.map((detalle) => (
                        <tr key={detalle.id_detalle_compra} className="border-b border-gray-300 hover:bg-gray-50">
                            <td className="px-4 py-2">{detalle.id_detalle_compra}</td>
                            <td className="px-4 py-2">{getInsumoName(detalle.id_insumo)}</td>
                            <td className="px-4 py-2">{detalle.cantidad}</td>
                            <td className="px-4 py-2">
                                {Number(detalle.precio_unitario).toFixed(2)}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
            <div className="mt-6">
                <Typography variant="h6" color="blue-gray" className="font-semibold">
                    Subtotal (con IVA 19%): ${(selectedCompra.total / 1.19).toFixed(2)}
                </Typography>
                <Typography variant="h6" color="blue-gray" className="font-semibold mt-2">
                    Total: ${(selectedCompra.total / 1.19).toFixed(2)}
                </Typography>
            </div>
        </div>
    </DialogBody>
    <DialogFooter className="bg-gray-100 p-4 flex justify-end rounded-b-lg border-t border-gray-300">
        <Button variant="gradient" className="btncancelarm" size="sm" onClick={handleDetailsOpen}>
            Cerrar
        </Button>
    </DialogFooter>
</Dialog>

  
            {/* Modal para capturar motivo de anulación */}
            <Dialog open={cancelOpen} handler={() => setCancelOpen(!cancelOpen)} className="max-w-xs w-11/12 bg-white rounded-lg shadow-lg" size="xs">
    <DialogHeader className="bg-gray-100 text-gray-800 p-3 rounded-t-lg border-b border-gray-300">
        <Typography variant="h6" className="font-semibold">Motivo de Anulación</Typography>
    </DialogHeader>
    <DialogBody divider className="p-4 bg-white">
        <Input 
            label="Motivo de Anulación"
            value={motivoAnulacion}
            onChange={(e) => setMotivoAnulacion(e.target.value)}
            className="w-full border-gray-300 rounded-md"
            required
        />
    </DialogBody>
    <DialogFooter className="bg-gray-100 p-3 flex justify-end gap-2 rounded-b-lg border-t border-gray-300">
        <Button variant="text" className="btncancelarm" size="sm" onClick={() => setCancelOpen(false)}>
            Cancelar
        </Button>
        <Button variant="gradient" className="btnagregarm" size="sm" onClick={handleCancelCompra}>
            Anular Compra
        </Button>
    </DialogFooter>
</Dialog>
        </>
    );
  }
  