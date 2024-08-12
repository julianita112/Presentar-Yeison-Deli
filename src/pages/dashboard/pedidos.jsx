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
import { PlusIcon, EyeIcon, TrashIcon, PencilIcon } from "@heroicons/react/24/solid";
import { useState, useEffect } from "react";
import axios from "../../utils/axiosConfig";
import Swal from 'sweetalert2';

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

export function Pedidos() {
  const [pedidos, setPedidos] = useState([]);
  const [filteredPedidos, setFilteredPedidos] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [productos, setProductos] = useState([]);
  const [open, setOpen] = useState(false);
  const [estadoOpen, setEstadoOpen] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false); // Estado para controlar el modal de anulación
  const [selectedPedido, setSelectedPedido] = useState({
    id_cliente: "",
    numero_pedido: "",
    fecha_entrega: "",
    fecha_pago: "",
    estado: "Esperando Pago",
    pagado: false,
    detallesPedido: [],
    clientesh: { nombre: "", contacto: "" }
  });
  const [motivoAnulacion, setMotivoAnulacion] = useState(''); // Estado para el motivo de anulación
  const [pedidoToCancel, setPedidoToCancel] = useState(null); // Estado para el pedido a cancelar
  const [selectedEstado, setSelectedEstado] = useState("");
  const [editMode, setEditMode] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pedidosPerPage] = useState(5);
  const [search, setSearch] = useState("");
  const [errors, setErrors] = useState({});

  useEffect(() => {
    fetchPedidos();
    fetchClientes();
    fetchProductos();
  }, []);

  const fetchPedidos = async () => {
    try {
      const response = await axios.get("http://localhost:3000/api/pedidos");
      setPedidos(response.data);
      setFilteredPedidos(response.data);
    } catch (error) {
      console.error("Error fetching pedidos:", error);
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
      const response = await axios.get("http://localhost:3000/api/productos/activos");
      setProductos(response.data);
    } catch (error) {
      console.error("Error fetching productos:", error);
    }
  };

  useEffect(() => {
    filterPedidos();
  }, [search, pedidos]);

  const filterPedidos = () => {
    const filtered = pedidos.filter((pedido) =>
      pedido.clientesh.nombre.toLowerCase().includes(search.toLowerCase())
    );
    setFilteredPedidos(filtered);
  };

  const handleOpenDialog = () => setOpen(true);
  const handleCloseDialog = () => setOpen(false);
  const handleEstadoOpen = (pedido) => {
    setSelectedPedido(pedido);
    setSelectedEstado(pedido.estado);
    setEstadoOpen(true);
  };
  const handleEstadoClose = () => setEstadoOpen(false);
  const handleDetailsOpen = () => setDetailsOpen(!detailsOpen);

  const generateUniqueOrderNumber = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let orderNumber = '';
    for (let i = 0; i < 10; i++) {
      orderNumber += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return orderNumber;
  };

  const handleCreate = () => {
    const orderNumber = generateUniqueOrderNumber();
    setSelectedPedido({
      id_cliente: "",
      numero_pedido: orderNumber,
      fecha_entrega: "",
      fecha_pago: "",
      estado: "Esperando Pago",
      pagado: false,
      detallesPedido: [],
      clientesh: { nombre: "", contacto: "" }
    });
    setEditMode(false);
    handleOpenDialog();
  };

  const handleEdit = (pedido) => {
    setSelectedPedido({
      ...pedido,
      detallesPedido: pedido.detallesPedido || [],
      clientesh: pedido.clientesh || { nombre: "", contacto: "" },
      fecha_entrega: pedido.fecha_entrega.split('T')[0],
      fecha_pago: pedido.fecha_pago ? pedido.fecha_pago.split('T')[0] : "",
      estado: pedido.estado,
    });
    setEditMode(true);
    handleOpenDialog();
  };

  const handleSave = async () => {
    if (!selectedPedido.id_cliente || !selectedPedido.fecha_entrega || selectedPedido.detallesPedido.length === 0) {
      Swal.fire({
        title: 'Error',
        text: 'Por favor, complete todos los campos requeridos.',
        icon: 'error',
        showClass: {
          popup: 'animate__animated animate__fadeInDown'
        },
        hideClass: {
          popup: 'animate__animated animate__fadeOutUp'
        }
      });
      return;
    }

    const newErrors = {};
    if (!selectedPedido.id_cliente) {
      newErrors.id_cliente = "El cliente es obligatorio ";
    }
    if (!selectedPedido.numero_pedido) {
      newErrors.numero_pedido = "El número de pedido es obligatorio";
    }
    if (!selectedPedido.fecha_entrega) {
      newErrors.fecha_entrega = "La fecha de entrega es obligatoria";
    }
    if (!selectedPedido.estado) {
      newErrors.estado = "El estado es obligatorio";
    }
    selectedPedido.detallesPedido.forEach((detalle, index) => {
      if (!detalle.id_producto) {
        newErrors[`producto_${index}`] = "El producto es obligatorio";
      }
      if (!detalle.cantidad) {
        newErrors[`cantidad_${index}`] = "La cantidad es obligatoria";
      }
    });

    if (!selectedPedido.pagado) {
      setSelectedPedido({ ...selectedPedido, fecha_pago: "" });
    }

    const pedidoToSave = {
      id_cliente: parseInt(selectedPedido.id_cliente),
      numero_pedido: selectedPedido.numero_pedido,
      fecha_entrega: new Date(selectedPedido.fecha_entrega).toISOString(),
      fecha_pago: selectedPedido.pagado && selectedPedido.fecha_pago ? new Date(selectedPedido.fecha_pago).toISOString() : null,
      estado: selectedPedido.pagado ? "Pendiente de Preparación" : "Esperando Pago",
      pagado: selectedPedido.pagado,
      detallesPedido: selectedPedido.detallesPedido.map(detalle => ({
        id_producto: parseInt(detalle.id_producto),
        cantidad: parseInt(detalle.cantidad)
      }))
    };

    try {
      if (editMode) {
        await axios.put(`http://localhost:3000/api/pedidos/${selectedPedido.id_pedido}`, pedidoToSave);
        Swal.fire({
          title: '¡Actualización exitosa!',
          text: 'El pedido ha sido actualizado correctamente.',
          icon: 'success',
          showClass: {
            popup: 'animate__animated animate__fadeInDown'
          },
          hideClass: {
            popup: 'animate__animated animate__fadeOutUp'
          }
        });
      } else {
        await axios.post("http://localhost:3000/api/pedidos", pedidoToSave);
        Swal.fire({
          title: '¡Creación exitosa!',
          text: 'El pedido ha sido creado correctamente.',
          icon: 'success',
          showClass: {
            popup: 'animate__animated animate__fadeInDown'
          },
          hideClass: {
            popup: 'animate__animated animate__fadeOutUp'
          }
        });
      }
      fetchPedidos();
      handleCloseDialog();
    } catch (error) {
      console.error("Error saving pedido:", error);
      Swal.fire({
        title: 'Error',
        text: 'Hubo un problema al guardar el pedido.',
        icon: 'error',
        showClass: {
          popup: 'animate__animated animate__fadeInDown'
        },
        hideClass: {
          popup: 'animate__animated animate__fadeOutUp'
        }
      });
    }
  };

  const handleDelete = async (id_pedido) => {
    const result = await Swal.fire({
      title: '¿Estás seguro?',
      text: `¿Estás seguro de que deseas eliminar este pedido?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#000000',
      confirmButtonText: 'Sí, eliminarlo',
      cancelButtonText: 'Cancelar'
    });

    if (result.isConfirmed) {
      try {
        await axios.delete(`http://localhost:3000/api/pedidos/${id_pedido}`);
        Swal.fire({
          title: '¡Eliminado!',
          text: 'El pedido ha sido eliminado.',
          icon: 'success',
          showClass: {
            popup: 'animate__animated animate__fadeInDown'
          },
          hideClass: {
            popup: 'animate__animated animate__fadeOutUp'
          }
        });
        fetchPedidos();
      } catch (error) {
        console.error("Error deleting pedido:", error);
        Swal.fire({
          icon: 'error',
          title: 'Error al eliminar',
          text: error.response?.data?.error || 'Hubo un problema al eliminar el pedido.',
          confirmButtonText: 'Aceptar',
          background: '#ffff',
          iconColor: '#A62A64',
          confirmButtonColor: '#000000',
          customClass: {
            title: 'text-lg font-semibold',
            icon: 'text-2xl',
            confirmButton: 'px-4 py-2 text-white'
          },
          showClass: {
            popup: 'animate__animated animate__fadeInDown'
          },
          hideClass: {
            popup: 'animate__animated animate__fadeOutUp'
          }
        });
      }
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setSelectedPedido({ ...selectedPedido, [name]: value });

    if (name === "fecha_entrega") {
      fetchTotalProductosVendidos(value);
    }
  };

  const handleSelectChange = (name, value) => {
    setSelectedPedido({ ...selectedPedido, [name]: value });
  };

  const fetchTotalProductosVendidos = async (fecha) => {
    try {
      const response = await axios.get(`http://localhost:3000/api/pedidos?fecha_entrega=${fecha}&pagado=true`);
      const pedidosPagados = response.data;

      let totalProductosVendidos = 0;
      pedidosPagados.forEach(pedido => {
        if (new Date(pedido.fecha_entrega).toDateString() === new Date(fecha).toDateString()) {
          pedido.detallesPedido.forEach(detalle => {
            totalProductosVendidos += detalle.cantidad;
          });
        }
      });

      Swal.fire({
        title: 'Información',
        text: `Tienes ${totalProductosVendidos} productos vendidos para esta fecha.`,
        icon: 'info',
        showClass: {
          popup: 'animate__animated animate__fadeInDown'
        },
        hideClass: {
          popup: 'animate__animated animate__fadeOutUp'
        },
        customClass: {
          container: 'swal-container'
        },
        timer: 2000,
        timerProgressBar: true,
      });

      return totalProductosVendidos;
    } catch (error) {
      console.error("Error fetching total productos vendidos:", error);
      return 0;
    }
  };

  const handlePagadoChange = (e) => {
    const isChecked = e.target.checked;
    const newEstado = isChecked ? "Pendiente de Preparación" : "Esperando Pago";
    setSelectedPedido({
      ...selectedPedido,
      pagado: isChecked,
      fecha_pago: isChecked ? selectedPedido.fecha_pago : "",
      estado: newEstado
    });
  };

  const handleDetalleChange = (index, name, value) => {
    const detalles = [...selectedPedido.detallesPedido];
    detalles[index][name] = value;
    setSelectedPedido({ ...selectedPedido, detallesPedido: detalles });
  };

  const handleAddDetalle = () => {
    setSelectedPedido({
      ...selectedPedido,
      detallesPedido: [...selectedPedido.detallesPedido, { id_producto: "", cantidad: "" }]
    });
  };

  const handleRemoveDetalle = (index) => {
    const detalles = [...selectedPedido.detallesPedido];
    detalles.splice(index, 1);
    setSelectedPedido({ ...selectedPedido, detallesPedido: detalles });
  };

  const handleSearchChange = (e) => {
    setSearch(e.target.value);
  };

  const handleViewDetails = (pedido) => {
    setSelectedPedido({
      ...pedido,
      detallesPedido: pedido.detallesPedido || [],
      clientesh: pedido.clientesh || { nombre: "", contacto: "" },
      fecha_entrega: pedido.fecha_entrega.split('T')[0],
      fecha_pago: pedido.fecha_pago ? pedido.fecha_pago.split('T')[0] : "",
      estado: pedido.estado,
    });
    handleDetailsOpen();
  };

  const handleUpdateEstado = async () => {
    try {
      const response = await axios.put(`http://localhost:3000/api/pedidos/${selectedPedido.numero_pedido}/estado`, { estado: selectedEstado });
      const updatedPedido = response.data;

      setPedidos((prevPedidos) =>
        prevPedidos.map((pedido) =>
          pedido.numero_pedido === updatedPedido.numero_pedido ? { ...pedido, estado: updatedPedido.estado } : pedido
        )
      );

      Swal.fire({
        title: '¡Actualización exitosa!',
        text: 'El estado del pedido ha sido actualizado correctamente.',
        icon: 'success',
        showClass: {
          popup: 'animate__animated animate__fadeInDown'
        },
        hideClass: {
          popup: 'animate__animated animate__fadeOutUp'
        }
      });
      handleEstadoClose();
    } catch (error) {
      console.error("Error updating estado del pedido:", error);
      Swal.fire({
        title: 'Error',
        text: 'Hubo un problema al actualizar el estado del pedido.',
        icon: 'error',
        showClass: {
          popup: 'animate__animated animate__fadeInDown'
        },
        hideClass: {
          popup: 'animate__animated animate__fadeOutUp'
        }
      });
    }
  };

  const toggleActivo = async (id_pedido, activo) => {
    const pedido = pedidos.find(p => p.id_pedido === id_pedido);
    if (!pedido) {
      Toast.fire({
        icon: 'error',
        title: 'Pedido no encontrado.',
      });
      return;
    }

    if (!activo && pedido.anulacion) { // Verifica si el pedido ya ha sido anulado
      Toast.fire({
        icon: 'error',
        title: 'No se puede reactivar un pedido anulado.',
      });
      return;
    }

    if (!activo) { // Si se está intentando activar el pedido
      try {
        await axios.patch(`http://localhost:3000/api/pedidos/${id_pedido}/estado`, { activo: true });
        fetchPedidos();
        Toast.fire({
          icon: 'success',
          title: 'El pedido ha sido activado correctamente.',
        });
      } catch (error) {
        console.error("Error al cambiar el estado del pedido:", error.response?.data || error.message);
        Toast.fire({
          icon: 'error',
          title: 'Hubo un problema al cambiar el estado del pedido.',
        });
      }
    } else {
      // Si se está intentando desactivar, abrimos el modal de anulación
      setPedidoToCancel(id_pedido);
      setCancelOpen(true);
    }
  };

  const handleCancelPedido = async () => {
    if (!motivoAnulacion.trim()) {
      Toast.fire({
        icon: 'error',
        title: 'Debe proporcionar un motivo de anulación.',
      });
      return;
    }
  
    try {
      await axios.patch(`http://localhost:3000/api/pedidos/${pedidoToCancel}/estado`, { 
        activo: false, 
        anulacion: motivoAnulacion 
      });
      fetchPedidos();
      Toast.fire({
        icon: 'success',
        title: 'El pedido ha sido anulado correctamente.',
      });
      setCancelOpen(false);
      setMotivoAnulacion('');
    } catch (error) {
      console.error("Error al anular el pedido:", error.response?.data || error.message);
      Toast.fire({
        icon: 'error',
        title: `Hubo un problema al anular el pedido: ${error.response?.data?.error || error.message}`,
      });
    }
  };

  const indexOfLastPedido = currentPage * pedidosPerPage;
  const indexOfFirstPedido = indexOfLastPedido - pedidosPerPage;
  const currentPedidos = filteredPedidos.slice(indexOfFirstPedido, indexOfLastPedido);

  const pageNumbers = [];
  for (let i = 1; i <= Math.ceil(filteredPedidos.length / pedidosPerPage); i++) {
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
            Crear Pedido
          </Button>
          <div className="mb-6">
            <Input
              type="text"
              placeholder="Buscar por cliente..."
              value={search}
              onChange={handleSearchChange}
            />
          </div>
          <div className="mb-1">
            <Typography variant="h6" color="blue-gray" className="mb-4">
              Lista de Pedidos
            </Typography>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cliente</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha de Entrega</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Activo</th>
                    <th scope="col" className="px-10 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Acciones
                    </th>
                    <th scope="col" className="px-10 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actualizar Estado
                    </th>
                    <th scope="col" className="relative px-6 py-3">
                      <span className="sr-only">Editar</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {currentPedidos.map((pedido) => (
                    <tr key={pedido.id_pedido}>
                      <td className="px-6 py-2 whitespace-nowrap text-sm font-medium text-gray-900">{pedido.clientesh.nombre}</td>
                      <td className="px-6 py-2 whitespace-nowrap text-sm text-gray-500">{pedido.fecha_entrega.split('T')[0]}</td>
                      <td className="px-6 py-2 whitespace-nowrap text-sm text-gray-500">{pedido.estado}</td>
                      <td className="px-6 py-2 whitespace-nowrap text-sm text-gray-500">
                      <button
  onClick={() => toggleActivo(pedido.id_pedido, pedido.activo)}
  className={`relative inline-flex items-center h-6 w-12 rounded-full p-1 duration-300 ease-in-out ${
    pedido.activo
      ? 'bg-gradient-to-r from-green-800 to-green-600 hover:from-green-600 hover:to-green-400 shadow-lg'
      : 'bg-gradient-to-r from-red-800 to-red-500 hover:from-red-600 hover:to-red-400 shadow-lg'
  }`}
>
  <span
    className={`inline-block w-5 h-5 transform bg-white rounded-full shadow-md transition-transform duration-300 ease-in-out ${
      pedido.activo ? 'translate-x-5' : 'translate-x-1'
    }`}
  />
</button>
</td>

                      <td className="px-6 py-2 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex space-x-1">
                          <IconButton
                            className="btnedit"
                            size="sm"
                            color="blue"
                            onClick={() => handleEdit(pedido)}
                            disabled={!pedido.activo || pedido.estado === "Completado"}
                          >
                            <PencilIcon className="h-4 w-4" />
                          </IconButton>
                          {/*<IconButton
                            className="cancelar"
                            size="sm"
                            color="red"
                            onClick={() => handleDelete(pedido.id_pedido)}
                            disabled={!pedido.activo}
                          >
                            <TrashIcon className="h-4 w-4" />
                          </IconButton> */}
                          <IconButton
                            className="btnvisualizar"
                            size="sm"
                            onClick={() => handleViewDetails(pedido)}
                            disabled={!pedido.activo}
                          >
                            <EyeIcon className="h-4 w-4" />
                          </IconButton>
                        </div>
                      </td>
                      <td className="px-6 py-2 whitespace-nowrap text-right text-sm font-medium">
                        <IconButton
                          className="btnupdate"
                          size="sm"
                          color="blue-gray"
                          onClick={() => handleEstadoOpen(pedido)}
                          disabled={!pedido.activo || pedido.estado === "Completado"}
                        >
                          <PencilIcon className="h-4 w-4" />
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

      <Dialog open={open} handler={handleCloseDialog} className="custom-modal max-w-4xl">
        <DialogHeader className="text-black p-2 text-lg">
          {editMode ? "Editar Pedido" : "Crear Pedido"}
        </DialogHeader>
        <DialogBody divider className="p-1 flex">
          <div className="flex-1 bg-gray-100 p-4 rounded-lg shadow-md flex flex-col gap-4 max-h-[60vh] overflow-y-auto">
            <div className="flex flex-col gap-2">
              <div className="w-full max-w-xs">
                <Select
                  label="Cliente"
                  name="id_cliente"
                  value={selectedPedido.id_cliente}
                  onChange={(e) => handleSelectChange('id_cliente', e)}
                  className="w-full text-xs"
                  required
                >
                  {clientes
                    .filter((cliente) => cliente.activo) // Filtra solo clientes activos
                    .map((cliente) => (
                      <Option key={cliente.id_cliente} value={cliente.id_cliente}>
                        {cliente.nombre}
                      </Option>
                    ))}
                </Select>
              </div>
              <div className="w-full max-w-xs">
                <Input
                  label="Número de Pedido"
                  name="numero_pedido"
                  type="text"
                  required
                  value={selectedPedido.numero_pedido}
                  onChange={handleChange}
                  className="w-full text-xs"
                  disabled // Número de pedido generado automáticamente
                />
              </div>
              <div className="w-full max-w-xs">
                <Input
                  label="Fecha de Entrega"
                  name="fecha_entrega"
                  type="date"
                  value={selectedPedido.fecha_entrega}
                  onChange={handleChange}
                  className="w-full text-xs"
                  required
                />
              </div>
              <div className="w-full max-w-xs">
                <Input
                  label="Fecha de Pago"
                  name="fecha_pago"
                  type="date"
                  value={selectedPedido.fecha_pago ? selectedPedido.fecha_pago : ""}
                  onChange={handleChange}
                  className="w-full text-xs"
                  disabled={!selectedPedido.pagado}
                />
              </div>

              
              <div className="w-full max-w-xs">
                
              </div>


              <div className="flex items-center gap-1 text-xs">
                <Typography className="text-gray-700">Pagado:</Typography>
                <input
                  type="checkbox"
                  name="pagado"
                  checked={selectedPedido.pagado}
                  onChange={handlePagadoChange}
                  className="form-checkbox"
                />
              </div>
              <Typography variant="h6" color="black" className="text-ms">
                Agregar Productos
              </Typography>
            </div>

            <div className="bg-gray-100 p-4 rounded-lg shadow-md flex flex-col gap-2">
              {selectedPedido.detallesPedido.map((detalle, index) => (
                <div key={index} className="relative flex flex-col gap-2 mb-4">
                  <div className="flex flex-col gap-2">
                    <Select
                      label="Producto"
                      required
                      name="id_producto"
                      value={detalle.id_producto}
                      onChange={(e) => handleDetalleChange(index, 'id_producto', e)}
                      className="w-full"
                    >
                      {productos.map((producto) => (
                        <Option key={producto.id_producto} value={producto.id_producto}>
                          {producto.nombre}
                        </Option>
                      ))}
                    </Select>
                    <Input
                      label="Cantidad"
                      name="cantidad"
                      type="number"
                      required
                      value={detalle.cantidad}
                      onChange={(e) => handleDetalleChange(index, 'cantidad', e.target.value)}
                      className="w-full"
                    />
                    <div className="flex justify-end">
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
                </div>
              ))}
              <div className="mt-2 flex justify-end">
                <Button className="btnmas" size="sm" onClick={handleAddDetalle}>
                  <PlusIcon className="h-4 w-4 mr-1" />
                </Button>
              </div>
            </div>
          </div>

          <div className="w-1/3 bg-gray-100 p-2 rounded-lg shadow-md max-h-[60vh] overflow-y-auto ml-4">
            <Typography variant="h6" color="blue-gray" className="mb-2">
              Detalles del Pedido
            </Typography>
            <ul className="list-disc pl-4">
              {selectedPedido.detallesPedido.map((detalle, index) => {
                const productoSeleccionado = productos.find(p => p.id_producto === detalle.id_producto);
                return (
                  <li key={index} className="mb-1">
                    <span className="font-semibold text-gray-800">
                      {productoSeleccionado ? productoSeleccionado.nombre : 'Producto no encontrado'}:
                    </span>
                    Cantidad {detalle.cantidad}
                  </li>
                );
              })}
            </ul>
          </div>
        </DialogBody>
        <DialogFooter className="bg-white p-2 flex justify-end gap-2">
          <Button variant="text" className="btncancelarm" size="sm" onClick={handleCloseDialog}>
            Cancelar
          </Button>
          <Button variant="gradient" className="btnagregarm" size="sm" onClick={handleSave}>
            {editMode ? "Guardar Cambios" : "Crear Pedido"}
          </Button>
        </DialogFooter>
      </Dialog>

      <Dialog open={estadoOpen} handler={handleEstadoClose} className="max-w-md w-11/12 p-6 bg-white rounded-lg shadow-lg" size="xs">
    <DialogHeader className="text-black p-2 text-lg">Actualizar Estado del Pedido</DialogHeader>
    <DialogBody divider className="p-1 flex flex-col gap-4">


          <Select
            label="Estado"
            name="estado"
            value={selectedEstado}
            onChange={(e) => setSelectedEstado(e)}
            className="w-full"
            required
            disabled={selectedPedido.estado === "Completado"}
          >
            {selectedPedido.pagado ? (
              <>
                <Option value="Pendiente de Preparación">Pendiente de Preparación</Option>
                <Option value="En Preparación">En Preparación</Option>
                <Option value="Listo Para Entrega">Listo Para Entrega</Option>
                <Option value="Completado">Completado</Option>
              </>
            ) : (
              <Option value="Esperando Pago">Esperando Pago</Option>
            )}
          </Select>
        </DialogBody>
        <DialogFooter className="bg-white p-2 flex justify-end gap-2">
          <Button variant="text" className="btncancelarm" size="sm" onClick={handleEstadoClose}>
            Cancelar
          </Button>
          <Button variant="gradient" className="btnagregarm" size="sm" onClick={handleUpdateEstado}>
            Actualizar Estado
          </Button>
        </DialogFooter>
      </Dialog>

      <Dialog open={detailsOpen} handler={handleDetailsOpen}>
        <DialogHeader>Detalles del Pedido</DialogHeader>
        <DialogBody divider className="overflow-y-auto max-h-[60vh]">
          {selectedPedido.clientesh && (
            <div>
              <Typography variant="h6" color="blue-gray">
                Información del Cliente
              </Typography>
              <table className="min-w-full mt-2">
                <tbody>
                  <tr>
                    <td className="font-semibold">ID Cliente:</td>
                    <td>{selectedPedido.clientesh.id_cliente}</td>
                  </tr>
                  <tr>
                    <td className="font-semibold">Nombre:</td>
                    <td>{selectedPedido.clientesh.nombre}</td>
                  </tr>
                  <tr>
                    <td className="font-semibold">Contacto:</td>
                    <td>{selectedPedido.clientesh.contacto}</td>
                  </tr>
                  <tr>
                    <td className="font-semibold">Creado:</td>
                    <td>{new Date(selectedPedido.clientesh.createdAt).toLocaleString()}</td>
                  </tr>
                  <tr>
                    <td className="font-semibold">Actualizado:</td>
                    <td>{new Date(selectedPedido.clientesh.updatedAt).toLocaleString()}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}
          <div className="mt-4">
            <Typography variant="h6" color="blue-gray">
              Detalles del Pedido
            </Typography>
            <table className="min-w-full mt-2">
              <tbody>
                <tr>
                  <td className="font-semibold">ID Pedido:</td>
                  <td>{selectedPedido.id_pedido}</td>
                </tr>
                <tr>
                  <td className="font-semibold">Número de Pedido:</td>
                  <td>{selectedPedido.numero_pedido}</td>
                </tr>
                <tr>
                  <td className="font-semibold">Fecha de Entrega:</td>
                  <td>{selectedPedido.fecha_entrega.split('T')[0]}</td>
                </tr>
                <tr>
                  <td className="font-semibold">Fecha de Pago:</td>
                  <td>{selectedPedido.fecha_pago ? selectedPedido.fecha_pago.split('T')[0] : "N/A"}</td>
                </tr>
                <tr>
                  <td className="font-semibold">Estado:</td>
                  <td>{selectedPedido.estado}</td>
                </tr>
                <tr>
                  <td className="font-semibold">Pagado:</td>
                  <td>{selectedPedido.pagado ? "Sí" : "No"}</td>
                </tr>
                <tr>
                  <td className="font-semibold">Creado:</td>
                  <td>{new Date(selectedPedido.createdAt).toLocaleString()}</td>
                </tr>
                <tr>
                  <td className="font-semibold">Actualizado:</td>
                  <td>{new Date(selectedPedido.updatedAt).toLocaleString()}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <div className="mt-4">
            <Typography variant="h6" color="blue-gray">
              Detalles de Productos
            </Typography>
            <table className="min-w-full mt-2">
              <thead>
                <tr>
                  <th className="font-semibold">ID Detalle</th>
                  <th className="font-semibold">Producto</th>
                  <th className="font-semibold">Cantidad</th>
                </tr>
              </thead>
              <tbody>
                {selectedPedido.detallesPedido.map((detalle) => (
                  <tr key={detalle.id_detalle_pedido}>
                    <td>{detalle.id_detalle_pedido}</td>
                    <td>{productos.find(p => p.id_producto === detalle.id_producto)?.nombre || 'Producto no encontrado'}</td>
                    <td>{detalle.cantidad}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </DialogBody>
        <DialogFooter>
          <Button variant="gradient" color="blue-gray" onClick={handleDetailsOpen}>
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
              <Button variant="gradient" className="btnagregarm" size="sm" onClick={handleCancelPedido}>
                  Anular Pedido
              </Button>
          </DialogFooter>
      </Dialog>
    </>
  );
}
