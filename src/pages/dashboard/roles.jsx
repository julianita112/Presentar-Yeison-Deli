

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
  Checkbox,
  Switch, // Importar Switch para el campo activo
} from "@material-tailwind/react";
import { PlusIcon, PencilIcon, TrashIcon, EyeIcon } from "@heroicons/react/24/solid";
import { useState, useEffect } from "react";
import axios from "../../utils/axiosConfig";
import Swal from 'sweetalert2';


// Definir el Toast
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


export function Roles() {
  const [roles, setRoles] = useState([]);
  const [filteredRoles, setFilteredRoles] = useState([]);
  const [open, setOpen] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedRole, setSelectedRole] = useState({
    nombre: "",
    permisosRol: [],
    activo: true, // Inicializar el campo activo por defecto
  });
  const [permisos, setPermisos] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [rolesPerPage] = useState(5);
  const [search, setSearch] = useState("");
  const [errors, setErrors] = useState({ nombre: "", permisos: "" });


  useEffect(() => {
    fetchRoles();
    fetchPermisos();
  }, []);


  const fetchRoles = async () => {
    try {
      const response = await axios.get("http://localhost:3000/api/roles");
      setRoles(response.data);
      setFilteredRoles(response.data);
    } catch (error) {
      console.error("Error fetching roles:", error);
    }
  };


  const fetchPermisos = async () => {
    try {
      const response = await axios.get("http://localhost:3000/api/permisos");
      setPermisos(response.data);
    } catch (error) {
      console.error("Error fetching permisos:", error);
    }
  };


  useEffect(() => {
    filterRoles();
  }, [search, roles]);


  const filterRoles = () => {
    const filtered = roles.filter((role) =>
      role.nombre.toLowerCase().includes(search.toLowerCase())
    );
    setFilteredRoles(filtered);
  };


  const handleOpen = () => setOpen(!open);
  const handleDetailsOpen = () => setDetailsOpen(!detailsOpen);


  const handleEdit = (role) => {
    setSelectedRole({
      ...role,
      permisosRol: role.permisosRol ? role.permisosRol.map(p => p.id_permiso) : [],
      activo: role.activo, // Set activo state when editing
    });
    setEditMode(true);
    handleOpen();
  };


  const handleCreate = () => {
    setSelectedRole({
      nombre: "",
      permisosRol: [],
      activo: true, // Default value when creating a new role
    });
    setEditMode(false);
    handleOpen();
  };


  const handleDelete = async (role) => {
    const result = await Swal.fire({
      title: '¿Estás seguro?',
      text: `¿Estás seguro de que deseas eliminar el rol ${role.nombre}?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#000000',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    });


    if (result.isConfirmed) {
      try {
        await axios.delete(`http://localhost:3000/api/roles/${role.id_rol}`);
        fetchRoles(); // Refrescar la lista de roles
        Toast.fire({
          icon: "success",
          title: "Rol eliminado exitosamente."
        });
      } catch (error) {
        console.error("Error deleting role:", error);
        Swal.fire({
          icon: 'error',
          title: 'Error al eliminar',
          text: 'No se puede eliminar un rol ya que este se encuentra asociado a un usuario y/o tiene permisos asignados.',
          confirmButtonText: 'Aceptar',
          background: '#ffff',
          iconColor: '#A62A64 ',
          confirmButtonColor: '#000000',
          customClass: {
            title: 'text-lg font-semibold',
            icon: 'text-2xl',
            confirmButton: 'px-4 py-2 text-white'
          }
        });
      }
    }
  };


  const validateForm = () => {
    let valid = true;
    const newErrors = { nombre: "", permisos: "" };


    if (!selectedRole.nombre.trim()) {
      newErrors.nombre = "Por favor ingrese un nombre para el rol";
      valid = false;
    }


    setErrors(newErrors);
    return valid;
  };


  const handleSave = async () => {
    if (!validateForm()) return;


    try {
      if (editMode) {
        await axios.put(`http://localhost:3000/api/roles/${selectedRole.id_rol}`, {
          nombre: selectedRole.nombre,
          permisos: selectedRole.permisosRol,
          activo: selectedRole.activo,
        });
        Toast.fire({
          icon: "success",
          title: "Rol editado exitosamente."
        });
      } else {
        await axios.post("http://localhost:3000/api/roles", {
          nombre: selectedRole.nombre,
          permisos: selectedRole.permisosRol,
          activo: selectedRole.activo,
        });
        Toast.fire({
          icon: "success",
          title: "Rol creado exitosamente."
        });
      }
      fetchRoles(); // Refrescar la lista de roles
      handleOpen();
    } catch (error) {
      console.error("Error saving role:", error);
      Swal.fire('Error', 'Hubo un problema al guardar el rol.', 'error');
    }
  };


  const handleChange = (e) => {
    const { name, value } = e.target;
    setSelectedRole({ ...selectedRole, [name]: value });
  };


  const handlePermissionChange = (id_permiso) => {
    const { permisosRol } = selectedRole;
    if (permisosRol.includes(id_permiso)) {
      setSelectedRole({ ...selectedRole, permisosRol: permisosRol.filter(p => p !== id_permiso) });
    } else {
      setSelectedRole({ ...selectedRole, permisosRol: [...permisosRol, id_permiso] });
    }
  };


  const handleSearchChange = (e) => {
    setSearch(e.target.value);
  };


  const handleViewDetails = (role) => {
    setSelectedRole({
      ...role,
      permisosRol: role.permisosRol ? role.permisosRol : [],
    });
    handleDetailsOpen();
  };


  const toggleActivo = async (id_rol, activo) => {
    try {
      if (activo) { // Solo verificamos si intentamos desactivar el rol
        // Verificar si existen usuarios con el rol que se intenta desactivar
        const response = await axios.get(`http://localhost:3000/api/usuarios`);
        const usuariosConRol = response.data.filter(usuario => usuario.id_rol === id_rol);
 
        if (usuariosConRol.length > 0) {
          Swal.fire({
            icon: 'warning',
            title: 'No se puede desactivar el rol',
            text: `Hay ${usuariosConRol.length} usuario(s) con este rol asignado.`,
          });
          return;
        }
      }
 
      // Si no hay usuarios con el rol, o si se está activando el rol, proceder con el cambio de estado
      await axios.patch(`http://localhost:3000/api/roles/${id_rol}/estado`, { activo: !activo });
      fetchRoles();
      Toast.fire({
        icon: 'success',
        title: `El rol ha sido ${!activo ? 'activado' : 'desactivado'} correctamente.`,
      });
    } catch (error) {
      console.error("Error al cambiar el estado del rol:", error);
      Toast.fire({
        icon: 'error',
        title: 'Hubo un problema al cambiar el estado del rol.',
      });
    }
  };
 
 


  // Obtener roles actuales
  const indexOfLastRole = currentPage * rolesPerPage;
  const indexOfFirstRole = indexOfLastRole - rolesPerPage;
  const currentRoles = filteredRoles.slice(indexOfFirstRole, indexOfLastRole);


  const pageNumbers = [];
  for (let i = 1; i <= Math.ceil(filteredRoles.length / rolesPerPage); i++) {
    pageNumbers.push(i);
  }


  // Cambiar de página
  const paginate = (pageNumber) => setCurrentPage(pageNumber);


  return (
    <>
      <div className="relative mt-2 h-32 w-full overflow-hidden rounded-xl bg-[url('/img/background-image.png')] bg-cover bg-center">
        <div className="absolute inset-0 h-full w-full bg-gray-900/75" />
      </div>
      <Card className="mx-3 -mt-16 mb-6 lg:mx-4 border border-blue-gray-100">
        <CardBody className="p-4">
          <Button onClick={handleCreate} className="btnagregar" size="sm" startIcon={<PlusIcon />}>
            Crear Rol
          </Button>
          <div className="mb-6">
            <Input
              type="text"
              placeholder="Buscar por rol..."
              value={search}
              onChange={handleSearchChange}
            />
          </div>
          <div className="mb-1">
            <Typography variant="h6" color="blue-gray" className="mb-4">
              Lista de Roles
            </Typography>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {currentRoles.map((role) => (
                <Card key={role.id_rol} className="p-4">
                  <Typography variant="h6" color="blue-gray">
                    {role.nombre}
                  </Typography>
                  <Typography color="blue-gray">
                    Permisos: {(role.permisosRol ? role.permisosRol : []).map(p => p.nombre_permiso).join(', ')}
                  </Typography>
                 
                  <div className="flex justify-between items-center mt-4 px-14"> 



<button
    onClick={() => toggleActivo(role.id_rol, role.activo)}
    className={`relative inline-flex items-center cursor-pointer transition-transform duration-300 ease-in-out h-6 w-12 rounded-full focus:outline-none ${
      role.activo
        ? 'bg-gradient-to-r from-green-800 to-green-600 hover:from-green-600 hover:to-green-400 shadow-lg transform scale-105'
        : 'bg-gradient-to-r from-red-800 to-red-500 hover:from-red-600 hover:to-red-400 shadow-lg transform scale-105'
    }`}
  >
    <span
      className={`transition-transform duration-300 ease-in-out ${
        role.activo ? 'translate-x-6' : 'translate-x-1'
      } inline-block w-5 h-5 transform bg-white rounded-full shadow-md`}
    />
    <span
      className={`absolute left-1 flex items-center text-xs text-white font-semibold ${
        role.activo ? 'opacity-0' : 'opacity-100'
      }`}
    >
      
    </span>
    <span
      className={`absolute right-1 flex items-center text-xs text-white font-semibold ${
        role.activo ? 'opacity-100' : 'opacity-0'
      }`}
    >
      
    </span>
  </button>



                    <div className="flex gap-2">
                      <IconButton className="btnedit" size="sm" onClick={() => handleEdit(role)} disabled={!role.activo}>
                        <PencilIcon className="h-5 w-5" />
                      </IconButton>
                      {/* <IconButton className="btncancelarinsumo" size="sm" onClick={() => handleDelete(role)} disabled={!role.activo}>
                        <TrashIcon className="h-5 w-5" />
                      </IconButton> */}
                      <IconButton className="btnvisualizar" size="sm" onClick={() => handleViewDetails(role)} disabled={!role.activo}>
                        <EyeIcon className="h-5 w-5" />
                      </IconButton>
                    </div>
                  </div>
                </Card>
              ))}
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
        <DialogHeader>{editMode ? "Editar Rol" : "Crear Rol"}</DialogHeader>
        <DialogBody divider className="overflow-auto max-h-[60vh]">
          <Input
            label="Nombre del rol"
            name="nombre"
            value={selectedRole.nombre}
            onChange={handleChange}
            error={errors.nombre}
            className={`mb-2 ${errors.nombre ? 'border-red-800' : ''}`}
            required
          />
          {errors.nombre && <Typography color="red" className="text-sm">{errors.nombre}</Typography>}
          <Typography variant="h6" color="blue-gray" className="mt-4">
            Permisos
          </Typography>
          <div className="grid grid-cols-4 gap-2 max-h-[30vh] overflow-y-auto">
            {permisos.map((permiso) => (
              <Checkbox
                key={permiso.id_permiso}
                label={permiso.nombre_permiso}
                checked={selectedRole.permisosRol.includes(permiso.id_permiso)}
                onChange={() => handlePermissionChange(permiso.id_permiso)}
                disabled={selectedRole.nombre.toLowerCase() === 'administrador' && permiso.nombre_permiso.toLowerCase() === 'roles'}
              />
            ))}
          </div>
          {errors.permisos && <Typography color="red" className="text-sm">{errors.permisos}</Typography>}
        </DialogBody>
        <DialogFooter>
          <Button variant="text" className="btncancelarm" size="sm" onClick={handleOpen}>
            Cancelar
          </Button>
          <Button variant="gradient" className="btnagregarm" size="sm" onClick={handleSave}>
            {editMode ? "Guardar Cambios" : "Crear Rol"}
          </Button>
        </DialogFooter>
      </Dialog>


      <Dialog open={detailsOpen} handler={handleDetailsOpen} className="max-w-xs w-11/12" size="xs" >
        <DialogHeader>Detalles del Rol</DialogHeader>
        <DialogBody divider>
          <Typography variant="h6" color="blue-gray" className="mb-2">
            Nombre:
          </Typography>
          <Typography>{selectedRole.nombre}</Typography>
          <Typography variant="h6" color="blue-gray" className="mt-4 mb-2">
            Permisos:
          </Typography>
          <Typography>
            {(selectedRole.permisosRol ? selectedRole.permisosRol : []).map(p => p.nombre_permiso).join(', ')}
          </Typography>
        </DialogBody>
        <DialogFooter>
          <Button variant="text" className="btncancelarm" size="sm" onClick={handleDetailsOpen}>
            Cerrar
          </Button>
        </DialogFooter>
      </Dialog>
    </>
  );
}



