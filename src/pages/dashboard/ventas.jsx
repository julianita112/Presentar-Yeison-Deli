import React, { useState, useEffect } from "react";
import jsPDF from "jspdf";
import "jspdf-autotable";
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
  Switch,
} from "@material-tailwind/react";
import { PlusIcon, EyeIcon, PencilIcon, TrashIcon, ArrowDownIcon } from "@heroicons/react/24/solid";
import axios from "../../utils/axiosConfig";
import Swal from "sweetalert2";
import 'jspdf-autotable';
import { Producir } from './Producir';  // Importamos el componente Producir

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

export function Ventas() {
  const [ventas, setVentas] = useState([]);
  const [filteredVentas, setFilteredVentas] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [productos, setProductos] = useState([]);
  const [pedidos, setPedidos] = useState([]);
  const [open, setOpen] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [productionOpen, setProductionOpen] = useState(false); // Estado para controlar el diálogo de producción
  const [selectedVenta, setSelectedVenta] = useState({
    id_cliente: "",
    numero_pedido: "",
    fecha_venta: "",
    estado: "pendiente",
    pagado: true,
    detalleVentas: [],
    cliente: { nombre: "", contacto: "" },
    total: 0,
    subtotal: 0,
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [ventasPerPage] = useState(5);
  const [search, setSearch] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [errors, setErrors] = useState({});

  useEffect(() => {
    fetchVentas();
    fetchClientes();
    fetchProductos();
    fetchPedidos();
  }, []);

  const fetchVentas = async () => {
    try {
      const response = await axios.get("http://localhost:3000/api/ventas");
      setVentas(response.data);
      setFilteredVentas(response.data);
    } catch (error) {
      console.error("Error fetching ventas:", error);
    }
  };

  const fetchClientes = async () => {
    try {
      const response = await axios.get("http://localhost:3000/api/clientes");
      setClientes(response.data);
    } catch (error) {
      console.error("Error fetching clientes:", error);
    }
  };

  const fetchProductos = async () => {
    try {
      const response = await axios.get("http://localhost:3000/api/productos");
      setProductos(response.data);
    } catch (error) {
      console.error("Error fetching productos:", error);
    }
  };

  const fetchPedidos = async () => {
    try {
      const response = await axios.get("http://localhost:3000/api/pedidos");
      // Filtrar pedidos con estado "Pendiente de Preparación"
      const pedidosPendientes = response.data.filter(pedido => pedido.estado === "Pendiente de Preparación");
      setPedidos(pedidosPendientes);
    } catch (error) {
      console.error("Error fetching pedidos:", error);
    }
};


  useEffect(() => {
    filterVentas();
  }, [search, startDate, endDate, ventas]);

  const filterVentas = () => {
    let filtered = ventas.filter((venta) =>
      venta.cliente.nombre.toLowerCase().includes(search.toLowerCase())
    );

    if (startDate && endDate) {
      filtered = filtered.filter(
        (venta) =>
          new Date(venta.fecha_venta) >= new Date(startDate) &&
          new Date(venta.fecha_venta) <= new Date(endDate)
      );
    }

    setFilteredVentas(filtered);
  };

  const handleOpen = () => setOpen(!open);
  const handleDetailsOpen = () => setDetailsOpen(!detailsOpen);
  const handleProductionOpen = () => setProductionOpen(!productionOpen); // Función para manejar el diálogo de producción

  const handleCreate = () => {
    setSelectedVenta({
      id_cliente: "",
      numero_pedido: "",
      fecha_venta: "",
      estado: "pendiente",
      pagado: true,
      detalleVentas: [],
      cliente: { nombre: "", contacto: "" },
      total: 0,
      subtotal: 0,
    });
    setErrors({});
    handleOpen();
  };

  const validateForm = () => {
    const newErrors = {};

    if (!selectedVenta.numero_pedido) {
      newErrors.numero_pedido = "El número de pedido es obligatorio";
    }
    if (!selectedVenta.id_cliente) {
      newErrors.id_cliente = "El cliente es obligatorio ";
    }
    if (!selectedVenta.fecha_venta) {
      newErrors.fecha_venta = "La fecha de venta es obligatoria";
    }
    if (!selectedVenta.estado) {
      newErrors.estado = "El estado es obligatorio";
    }
    if (selectedVenta.detalleVentas.length === 0) {
      newErrors.detalleVentas = "Debe agregar al menos un detalle de venta";
    }
    selectedVenta.detalleVentas.forEach((detalle, index) => {
      if (!detalle.id_producto) {
        newErrors[`producto_${index}`] = "El producto es obligatorio";
      }
      if (!detalle.cantidad) {
        newErrors[`cantidad_${index}`] = "La cantidad es obligatoria";
      }
      if (!detalle.precio_unitario) {
        newErrors[`precio_${index}`] = "El precio unitario es obligatorio";
      }
    });

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return false;
    }

    return true;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      return;
    }

    const ventaToSave = {
      id_cliente: parseInt(selectedVenta.id_cliente),
      numero_pedido: selectedVenta.numero_pedido,
      fecha_venta: selectedVenta.fecha_venta,
      estado: selectedVenta.estado,
      pagado: selectedVenta.pagado,
      total: selectedVenta.total,
      detalleVentas: selectedVenta.detalleVentas.map((detalle) => ({
        id_producto: parseInt(detalle.id_producto),
        cantidad: parseInt(detalle.cantidad),
        precio_unitario: parseFloat(detalle.precio_unitario),
      })),
    };

    try {
      await axios.post("http://localhost:3000/api/ventas", ventaToSave);
      Swal.fire({
        icon: "success",
        title: "¡Creación exitosa!",
        text: "La venta ha sido creada correctamente.",
      });
      fetchVentas();
      handleOpen();
    } catch (error) {
      console.error("Error saving venta:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Hubo un problema al guardar la venta.",
      });
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setSelectedVenta({ ...selectedVenta, [name]: value });
    setErrors({ ...errors, [name]: "" });
  };

  const handleDetalleChange = (index, e) => {
    const { name, value } = e.target;
    const detalles = [...selectedVenta.detalleVentas];
    detalles[index][name] = value;
    setSelectedVenta({ ...selectedVenta, detalleVentas: detalles });
    setErrors({ ...errors, [`${name}_${index}`]: "" });
    updateTotal(detalles);
  };

  const handleAddDetalle = () => {
    setSelectedVenta({
      ...selectedVenta,
      detalleVentas: [...selectedVenta.detalleVentas, { id_producto: "", cantidad: "", precio_unitario: "" }],
    });
  };

  const handleRemoveDetalle = (index) => {
    const detalles = [...selectedVenta.detalleVentas];
    detalles.splice(index, 1);
    setSelectedVenta({ ...selectedVenta, detalleVentas: detalles });
    updateTotal(detalles);
  };

  const updateTotal = (detalles) => {
    const subtotal = detalles.reduce((acc, detalle) => acc + (parseFloat(detalle.precio_unitario) || 0) * (parseInt(detalle.cantidad) || 0), 0);
    const total = subtotal * 1.19; // Agrega el IVA del 19%
    setSelectedVenta(prevState => ({
      ...prevState,
      total,
      subtotal
    }));
  };

  const handleSearchChange = (e) => {
    setSearch(e.target.value);
  };

  const handleViewDetails = (venta) => {
    const detallesFormateados = venta.detalles.map(detalle => ({
        ...detalle,
        precio_unitario: parseFloat(detalle.precio_unitario)
    }));

    setSelectedVenta({
        ...venta,
        detalleVentas: detallesFormateados,
        cliente: venta.cliente || { nombre: "", contacto: "" },
        fecha_venta: venta.fecha_venta.split('T')[0],
        subtotal: parseFloat(venta.total) / 1.19,
        total: parseFloat(venta.total)
    });
    handleDetailsOpen();
  };

  const handleUpdateState = async (id_venta) => {
    const { value: estado } = await Swal.fire({
      title: 'Actualizar Estado',
      input: 'select',
      inputOptions: {
        pendiente: 'Pendiente',
        'en preparación': 'En preparación',
        completado: 'Completado',
      },
      inputPlaceholder: 'Selecciona el estado',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#aaa',
      confirmButtonText: 'Actualizar',
      cancelButtonText: 'Cancelar',
    });

    if (estado) {
      try {
        await axios.put(`http://localhost:3000/api/ventas/${id_venta}/estado`, { estado });
        Swal.fire("¡Actualización exitosa!", "El estado de la venta ha sido actualizado.", "success");
        fetchVentas();
      } catch (error) {
        console.error("Error updating estado:", error);
        Swal.fire("Error", "Hubo un problema al actualizar el estado de la venta.", "error");
      }
    }
  };

  const handlePedidoChange = async (numero_pedido) => {
    const pedido = pedidos.find(p => p.numero_pedido === numero_pedido);
    if (pedido) {
      const detalles = pedido.detallesPedido.map(detalle => ({
        id_producto: detalle.id_producto,
        cantidad: detalle.cantidad,
        precio_unitario: parseFloat(productos.find(p => p.id_producto === detalle.id_producto)?.precio || 0),
      }));
      setSelectedVenta({
        ...selectedVenta,
        id_cliente: pedido.id_cliente,
        numero_pedido: pedido.numero_pedido,
        fecha_venta: pedido.fecha_pago ? pedido.fecha_pago.split('T')[0] : "",
        detalleVentas: detalles,
      });
      updateTotal(detalles);
    }
  };

  const handleToggleActivo = async (id_venta, activo) => {
    try {
      await axios.patch(`http://localhost:3000/api/ventas/${id_venta}/estado`, { activo });
      fetchVentas();
    } catch (error) {
      console.error("Error updating activo state:", error);
      Swal.fire("Error", "Hubo un problema al actualizar el estado activo de la venta.", "error");
    }
  };

  const generatePDF = (venta) => {
    console.log("Generating PDF for:", venta);
  
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text(`Comprobante de Venta`, 105, 15, { align: 'center' });
    doc.setFontSize(12);
  
    // Información general de la venta
    doc.text(`Número de Pedido: ${venta.numero_pedido}`, 20, 50);
    doc.text(`Fecha de Venta: ${new Date(venta.fecha_venta).toLocaleDateString()}`, 20, 60);
    //doc.text(`Estado: ${venta.estado}`, 20, 50);
    //doc.text(`Pagado: ${venta.pagado ? 'Sí' : 'No'}`, 20, 60);
  
    // Información del cliente
    doc.setFontSize(14);
    doc.text('Información del Cliente', 20, 75);
    doc.setFontSize(12);
    doc.text(`Nombre: ${venta.cliente.nombre}`, 20, 85);
    doc.text(`Contacto: ${venta.cliente.contacto}`, 20, 95);
    doc.text(`Email: ${venta.cliente.email}`, 20, 105);
    doc.text(`Tipo de Documento: ${venta.cliente.tipo_documento}`, 20, 115);
    doc.text(`Número de Documento: ${venta.cliente.numero_documento}`, 20, 125);
  
    // Detalles de los productos
    doc.setFontSize(14);
    doc.text('Detalles de los Productos', 20, 140);
    doc.setFontSize(12);
  
    const detalles = Array.isArray(venta.detalleVentas) ? venta.detalleVentas : 
                     (Array.isArray(venta.detalles) ? venta.detalles : []);
  
    doc.autoTable({
      startY: 150,
      head: [['ID Producto', 'Cantidad', 'Precio Unitario', 'Subtotal']],
      body: detalles.map((detalle) => [
        detalle.id_producto,
        detalle.cantidad,
        `$${parseFloat(detalle.precio_unitario || 0).toFixed(2)}`,
        `$${(parseFloat(detalle.precio_unitario || 0) * parseInt(detalle.cantidad || 0)).toFixed(2)}`
      ]),
    });
  
    // Totales
    const subtotal = parseFloat(venta.total) / 1.19;
    const iva = parseFloat(venta.total) - subtotal;
  
    doc.text(`Subtotal: $${subtotal.toFixed(2)}`, 140, doc.lastAutoTable.finalY + 20);
    doc.text(`IVA (19%): $${iva.toFixed(2)}`, 140, doc.lastAutoTable.finalY + 30);
    doc.setFontSize(14);
    doc.text(`Total: $${parseFloat(venta.total).toFixed(2)}`, 140, doc.lastAutoTable.finalY + 40);
  
    // Información adicional
    doc.setFontSize(10);
    doc.text(`Fecha de Creación: ${new Date(venta.createdAt).toLocaleString()}`, 20, doc.internal.pageSize.height - 20);
    doc.text(`Última Actualización: ${new Date(venta.updatedAt).toLocaleString()}`, 20, doc.internal.pageSize.height - 10);
  
    doc.save(`Comprobante_Venta_${venta.numero_pedido}.pdf`);
  };

  const indexOfLastVenta = currentPage * ventasPerPage;
  const indexOfFirstVenta = indexOfLastVenta - ventasPerPage;
  const currentVentas = filteredVentas.slice(indexOfFirstVenta, indexOfLastVenta);

  const pageNumbers = [];
  for (let i = 1; i <= Math.ceil(filteredVentas.length / ventasPerPage); i++) {
    pageNumbers.push(i);
  }

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  return (
    <>
      <div className="relative mt-2 h-32 w-full overflow-hidden rounded-xl bg-[url('/img/background-image.png')] bg-cover bg-center">
        <div className="absolute inset-0 h-full w-full bg-gray-900/75" />
      </div>
      <Card className="mx-3 -mt-16 mb-6 lg:mx-4 border border-blue-gray-100">
        <CardBody className="p-4">
          <Button onClick={handleCreate} className="btnagregar" size="sm" startIcon={<PlusIcon />}>
            Crear Venta
          </Button>
          <Button onClick={handleProductionOpen} className="btnagregar" size="sm" startIcon={<PlusIcon />} style={{ marginLeft: '10px' }}>
            Producción
          </Button>
          <div className="mb-6">
            <Input
              type="text"
              placeholder="Buscar por cliente"
              value={search}
              onChange={handleSearchChange}
            />
            <div className="mt-4 flex gap-4">
              <Input
                type="date"
                label="Fecha Inicio"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
              <Input
                type="date"
                label="Fecha Fin"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>

          <div className="mb-1">
            <Typography variant="h6" color="blue-gray" className="mb-4">
              Lista de Ventas
            </Typography>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      CLIENTE
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      FECHA DE VENTA
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      ESTADO
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      ACTIVO
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      ACCIONES
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {currentVentas.map((venta) => (
                    <tr key={venta.id_venta}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {venta.cliente.nombre}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {venta.fecha_venta.split('T')[0]}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {venta.estado}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
  <button
    onClick={() => handleToggleActivo(venta.id_venta, !venta.activo)}
    className={`relative inline-flex items-center h-6 w-12 rounded-full p-1 duration-300 ease-in-out ${
      venta.activo
        ? 'bg-gradient-to-r from-green-800 to-green-600 hover:from-green-600 hover:to-green-400 shadow-lg'
        : 'bg-gradient-to-r from-red-800 to-red-500 hover:from-red-600 hover:to-red-400 shadow-lg'
    }`}
  >
    <span
      className={`inline-block w-5 h-5 transform bg-white rounded-full shadow-md transition-transform duration-300 ease-in-out ${
        venta.activo ? 'translate-x-5' : 'translate-x-1'
      }`}
    />
  </button>
</td>

                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium flex gap-2">
                        <IconButton className="btnvisualizar" size="sm" onClick={() => handleViewDetails(venta)}>
                          <EyeIcon className="h-5 w-5" />
                        </IconButton>
                        <IconButton className="btnedit" size="sm" onClick={() => handleUpdateState(venta.id_venta)}>
                          <PencilIcon className="h-5 w-5" />
                        </IconButton>
                        <IconButton className="btnpdf" size="sm" onClick={() => generatePDF(venta)}>
                          <ArrowDownIcon className="h-5 w-5" />
                        </IconButton>
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

      <Dialog open={open} handler={handleOpen} className="custom-modal max-w-4xl">
        <DialogHeader className="text-black p-2 text-lg">Crear Venta</DialogHeader>
        <DialogBody divider className="flex max-h-[60vh] p-4 gap-6">
          <div className="flex-1 flex flex-col gap-4 overflow-y-auto">
            <div className="w-full max-w-xs">
              <Select
                label="Número de Pedido"
                name="numero_pedido"
                required
                value={selectedVenta.numero_pedido}
                onChange={(e) => {
                  handlePedidoChange(e);
                  setErrors({ ...errors, numero_pedido: "" });
                }}
                className="w-full text-sm"
              >
                {pedidos.map((pedido) => (
                  <Option key={pedido.numero_pedido} value={pedido.numero_pedido}>
                    {pedido.numero_pedido}
                  </Option>
                ))}
              </Select>
              {errors.numero_pedido && (
                <p className="text-red-500 text-xs mt-1">{errors.numero_pedido}</p>
              )}
            </div>
            <div className="w-full max-w-xs">
              <Select
                label="Cliente"
                name="id_cliente"
                required
                value={selectedVenta.id_cliente}
                onChange={(e) => {
                  setSelectedVenta({ ...selectedVenta, id_cliente: e });
                  setErrors({ ...errors, id_cliente: "" });
                }}
                className="w-full text-sm"
              >
                {clientes.map((cliente) => (
                  <Option key={cliente.id_cliente} value={cliente.id_cliente}>
                    {cliente.nombre}
                  </Option>
                ))}
              </Select>
              {errors.id_cliente && (
                <p className="text-red-500 text-xs mt-1">{errors.id_cliente}</p>
              )}
            </div>
            <div className="w-full max-w-xs">
              <Input
                label="Fecha de Venta"
                name="fecha_venta"
                type="date"
                required
                value={selectedVenta.fecha_venta}
                onChange={(e) => {
                  handleChange(e);
                  setErrors({ ...errors, fecha_venta: "" });
                }}
                className="w-full text-sm"
              />
              {errors.fecha_venta && (
                <p className="text-red-500 text-xs mt-1">{errors.fecha_venta}</p>
              )}
            </div>
            <div className="w-full max-w-xs">
              <Select
                label="Estado"
                name="estado"
                required
                value={selectedVenta.estado}
                onChange={(e) => {
                  setSelectedVenta({ ...selectedVenta, estado: e });
                  setErrors({ ...errors, estado: "" });
                }}
                className="w-full text-sm"
              >
                <Option value="pendiente">Pendiente</Option>
                <Option value="en preparación">En preparación</Option>
                <Option value="completado">Completado</Option>
              </Select>
              {errors.estado && (
                <p className="text-red-500 text-xs mt-1">{errors.estado}</p>
              )}
            </div>
            <Typography variant="h6" color="blue-gray" className="mt-4 text-sm">
              Detalles de la Venta
            </Typography>
            <div className="bg-gray-100 p-4 rounded-xs shadow-md flex-1 mt-2 mb-4">
              {selectedVenta.detalleVentas.map((detalle, index) => (
                <div key={index} className="mb-4 flex items-center">
                  <div className="flex-1 flex flex-col gap-4">
                    <div className="w-full max-w-xs">
                      <Select
                        label="Producto"
                        name="id_producto"
                        required
                        value={detalle.id_producto}
                        onChange={(e) => {
                          handleDetalleChange(index, { target: { name: 'id_producto', value: e } });
                          setErrors({ ...errors, [`producto_${index}`]: "" });
                        }}
                        className="w-full text-sm"
                      >
                        {productos.map((producto) => (
                          <Option key={producto.id_producto} value={producto.id_producto}>
                            {producto.nombre}
                          </Option>
                        ))}
                      </Select>
                      {errors[`producto_${index}`] && (
                        <p className="text-red-500 text-xs mt-1">{errors[`producto_${index}`]}</p>
                      )}
                    </div>
                    <div className="w-full max-w-xs">
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
                        className="w-full text-sm"
                      />
                      {errors[`cantidad_${index}`] && (
                        <p className="text-red-500 text-xs mt-1">{errors[`cantidad_${index}`]}</p>
                      )}
                    </div>
                    <div className="w-full max-w-xs">
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
                        className="w-full text-sm"
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
                      <TrashIcon className="h-5 w-5" />
                    </IconButton>
                  </div>
                </div>
              ))}
              <div className="mt-2 flex justify-end">
                <Button className="btnmas" size="sm" onClick={handleAddDetalle}>
                  <PlusIcon className="h-4 w-4 mr-1" />
                </Button>
              </div>
            </div>
          </div>

          <div className="w-full max-w-xs bg-gray-100 p-4 rounded-lg shadow-md max-h-[60vh]">
            <Typography variant="h6" color="blue-gray" className="mb-4 text-lg">
              Detalles de la Venta
            </Typography>
            <ul className="list-disc pl-4 text-sm">
              {selectedVenta.detalleVentas.map((detalle, index) => (
                <li key={index} className="mb-2">
                  <span className="font-semibold text-gray-800">
                    {productos.find(producto => producto.id_producto === detalle.id_producto)?.nombre || 'Desconocido'}:
                  </span>
                  Cantidad {detalle.cantidad}, Precio Unitario ${parseFloat(detalle.precio_unitario).toFixed(2)}
                </li>
              ))}
            </ul>
            <div className="mt-4">
              <Typography variant="h6" color="blue-gray">
                SubTotal: ${(selectedVenta.total / 1.19).toFixed(2)}
              </Typography>
              <Typography variant="h6" color="blue-gray">
                Total: ${selectedVenta.total.toFixed(2)}
              </Typography>
            </div>
          </div>
        </DialogBody>
        <DialogFooter className="bg-white p-4 flex justify-end gap-2">
          <Button variant="text" className="btncancelarm" size="sm" onClick={handleOpen}>
            Cancelar
          </Button>
          <Button variant="gradient" className="btnagregarm" size="sm" onClick={handleSave}>
            Crear Venta
          </Button>
        </DialogFooter>
      </Dialog>

      <Producir
        open={productionOpen} 
        handleProductionOpen={handleProductionOpen} 
        productosActivos={productos} 
        fetchProductos={fetchProductos} 
        fetchProductosActivos={fetchProductos} 
      />

      <Dialog open={detailsOpen} handler={handleDetailsOpen} className="max-w-3xl mx-auto p-6 bg-white rounded-lg shadow-lg">
        <DialogHeader className="text-lg font-semibold text-gray-800 border-b border-gray-300">
          Detalles de la Venta
        </DialogHeader>
        <DialogBody divider className="overflow-y-auto max-h-[60vh] p-4">
          {selectedVenta.cliente && (
            <div className="mb-6">
              <Typography variant="h6" color="blue-gray" className="font-semibold mb-2">
                Información del Cliente
              </Typography>
              <table className="w-full text-sm border-collapse">
                <tbody>
                  <tr className="border-b">
                    <td className="font-medium text-gray-700 py-2 px-4">ID Cliente:</td>
                    <td className="py-2 px-4">{selectedVenta.cliente.id_cliente}</td>
                  </tr>
                  <tr className="border-b">
                    <td className="font-medium text-gray-700 py-2 px-4">Nombre:</td>
                    <td className="py-2 px-4">{selectedVenta.cliente.nombre}</td>
                  </tr>
                  <tr className="border-b">
                    <td className="font-medium text-gray-700 py-2 px-4">Contacto:</td>
                    <td className="py-2 px-4">{selectedVenta.cliente.contacto}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}
          <div className="mb-6">
            <Typography variant="h6" color="blue-gray" className="font-semibold mb-2">
              Detalles de la Venta
            </Typography>
            <table className="w-full text-sm border-collapse">
              <tbody>
                <tr className="border-b">
                  <td className="font-medium text-gray-700 py-2 px-4">ID Venta:</td>
                  <td className="py-2 px-4">{selectedVenta.id_venta}</td>
                </tr>
                <tr className="border-b">
                  <td className="font-medium text-gray-700 py-2 px-4">Número de Pedido:</td>
                  <td className="py-2 px-4">{selectedVenta.numero_pedido}</td>
                </tr>
                <tr className="border-b">
                  <td className="font-medium text-gray-700 py-2 px-4">Fecha de Venta:</td>
                  <td className="py-2 px-4">{selectedVenta.fecha_venta.split('T')[0]}</td>
                </tr>
                <tr className="border-b">
                  <td className="font-medium text-gray-700 py-2 px-4">Estado:</td>
                  <td className="py-2 px-4">{selectedVenta.estado}</td>
                </tr>
                <tr className="border-b">
                  <td className="font-medium text-gray-700 py-2 px-4">Pagado:</td>
                  <td className="py-2 px-4">{selectedVenta.pagado ? "Sí" : "No"}</td>
                </tr>
                <tr className="border-b">
                  <td className="font-medium text-gray-700 py-2 px-4">SubTotal:</td>
                  <td className="py-2 px-4">${(selectedVenta.total / 1.19).toFixed(2)}</td>
                </tr>
                <tr className="border-b">
                  <td className="font-medium text-gray-700 py-2 px-4">Total:</td>
                  <td className="py-2 px-4">${selectedVenta.total.toFixed(2)}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <div className="mb-6 overflow-x-auto">
            <Typography variant="h6" color="blue-gray" className="font-semibold mb-2">
              Detalles de Productos
            </Typography>
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-gray-100 border-b">
                  <th className="font-medium text-gray-700 py-2 px-4">ID Detalle</th>
                  <th className="font-medium text-gray-700 py-2 px-4">Producto</th>
                  <th className="font-medium text-gray-700 py-2 px-4">Cantidad</th>
                  <th className="font-medium text-gray-700 py-2 px-4">Precio Unitario</th>
                </tr>
              </thead>
              <tbody>
                  {selectedVenta.detalleVentas.map((detalle) => (
                    <tr key={detalle.id_detalle_venta} className="border-b">
                      <td className="py-2 px-4">{detalle.id_detalle_venta}</td>
                      <td className="py-2 px-4">{productos.find(p => p.id_producto === detalle.id_producto)?.nombre || 'Producto no encontrado'}</td>
                      <td className="py-2 px-4">{detalle.cantidad}</td>
                      <td className="py-2 px-4">${parseFloat(detalle.precio_unitario).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
            </table>
          </div>
        </DialogBody>
        <DialogFooter className="p-4 border-t border-gray-300 flex justify-end">
          <Button variant="gradient" className="btncancelarm" size="sm" onClick={handleDetailsOpen}>
            Cerrar
          </Button>
        </DialogFooter>
      </Dialog>
    </>
  );
}

export default Ventas;