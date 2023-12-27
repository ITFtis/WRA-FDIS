using SGDS.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.Mvc;

namespace SGDS.Controllers.Manager
{
    [Dou.Misc.Attr.MenuDef(Id ="Role", Name = "角色管理", MenuPath = "系統管理", Action = "Index", Index = 1, Func = Dou.Misc.Attr.FuncEnum.ALL, AllowAnonymous = false)]
    public class RoleController : Dou.Controllers.RoleBaseController<Role>
    {
        // GET: Role
        public ActionResult Index()
        {
            return View();
        }

        internal static System.Data.Entity.DbContext _dbContext = new DouModelContextExt();
        protected override Dou.Models.DB.IModelEntity<Role> GetModelEntity()
        {
            return new Dou.Models.DB.ModelEntity<Role>(_dbContext);
        }
    }

}