
(function ($) {
    var hubName = 'hallHub';
    $scope.NewRecord.selectedPage = [];
    var mainPage = {
        init: function(){
            var user = $.App.getUser();
            $.App.page_access_logic(user, function(res){
                $.App.setActive('hall', function(dt){ //set active page class
                    $.App.display_menu(dt,user); //handle menuu
                    $.App.setPageAcess('hall'); //check page access                                       
                    setTimeout(function () {                            
                        $('.page-loader-wrapper').fadeOut(); 
                        mainPage.load_dropdown('#cat_drop',['hall_category_list'],'Select Hall Category');
                        mainPage.fetchRecord();
                    }, 50);
                });
            });
        },
        load_dropdown: function(el,arr,placeholder){
            //fetch hall dropdowns            
            $.App.handleServerRequest(hubName, arr, function (response) {
                var dt = JSON.parse(response);        
                if(dt.length){           
                    dt = _.sortBy(dt,'drop_text');
                    pageList = dt; //set page to list
                    var template = '{{#each data }}<option value="{{drop_value}}">{{drop_text}}</option>{{/each}}';   
                    $(el).html('<option value="" disabled>'+placeholder+'</option>').append(Handlebars.compile(template)({data:dt})); 
                    $(el).selectpicker('refresh');
                }
            });   
        },
        fetchRecord: function(){
            $.App.handleServerRequest(hubName,['select'], function (response) {
                // console.log("select => ",response);
                $scope.savedRecords = JSON.parse(response).map(function(o,i,a){
                    o.hall_active = (o.hall_active === 1) ? 'Yes':'No';
                    return o;
                });
                var rawData = {
                    "HEADERS": [{
                        "DT_HEADER": "S/N,Name,Code,Capacity,Active,Type,Posted By,Date Created,Action,",
                        "DT_COLUMN": [{ "mDataProp": "null" }, { "mDataProp": "hall_name" }, { "mDataProp": "hall_code" }, { "mDataProp": "hall_capacity" }, { "mDataProp": "hall_active" }, 
                        { "mDataProp": "hall_category" }, { "mDataProp": "posted_by" }, { "mDataProp": "date_created" }, { "mDataProp": null }, { "mDataProp": null }],
                        "DT_HEADER_ALIGN": "center,left,center,right,center,left,center,center,center,",
                        "DT_DRILL_CODE": "", "DT_DRILL_PARENT": ""
                    }],
                    "SAVED": $scope.savedRecords
                }
                $.App.loadRecord(rawData);
            }); 
              
        },
        resetForm: function () {            
            mainPage.fetchRecord();
        },
        acc_pt: function($el,action){
            var a = {
                
                handleForm : function(){
                    var scope = {
                        code : $("#code").val(), name : $("#name").val(), type : $("#cat_drop").selectpicker('val'),
                        cat_active : $('input[name="active"]:checked').val(), capacity : $("#capacity").val(),
                        uid: $.App.getUID(), pid: $.App.getCurrentPage().page_id,
                    }
                    return scope;
                },
                clearForm: function(){
                    $.App.clearForm('form#hall');
                    $('#active_no').prop('checked',true);
                    $('#cat_drop').selectpicker('val',[]);
                    $('#save_btn,#clear_btn').removeClass('display-hide'); $('#update_btn,#close_btn').addClass('display-hide');                   
                },
                closeForm: function(){
                    a.clearForm();
                    $('#save_btn,#clear_btn').removeClass('display-hide'); $('#update_btn,#close_btn').addClass('display-hide');
                    $('[data-page="grid-view"]').click();
                },
                dbRequest : function(){
                    switch($el.data("act-type")){
                        case "save":
                        case "update":
                            var obj = a.handleForm();
                            if(obj.code.length == 0 || obj.name.length == 0 || obj.type.length == 0 || obj.capacity.length == 0 ) 
                                return $.App.Alert("Empty field cannot be submitted","warning");
                            console.log(obj); 
                            var arr = [$el.data("act-type"), obj];
                            if($el.data("act-type") == "update"){
                                obj.hid = $scope.NewRecord.hall_id;
                                obj.dc = $.App.getCurrentDate();
                            } 
                            $.App.handleServerRequest(hubName, arr, function (response) {
                                var res = response.split(',')                 
                                $.App.Alert(res[0],res[1]);
                                switch(res[1]){
                                    case 'success':
                                        a.clearForm();
                                        mainPage.fetchRecord();
                                        break;
                                    default:
                                        break;
                                }       
                            });
                        break;
                        case "edit":
                            var index = $el.closest('tr').find('td:first').find('div').data('sn'), actiontype = $el.data('action')
                            $scope.NewRecord = $scope.savedRecords[index];
                            $scope.NewRecord.hall_active == "Yes" ? $('#active_yes').prop('checked',true) : $('#active_no').prop('checked',true);                            
                            $("#name").val($scope.NewRecord.hall_name); $("#code").val($scope.NewRecord.hall_code); $("#cat_drop").selectpicker('val', $scope.NewRecord.category_id);   
                            $("#capacity").val($scope.NewRecord.hall_capacity);     
                            //set button
                            $('#save_btn,#clear_btn').addClass('display-hide'); $('#update_btn,#close_btn').removeClass('display-hide');
                            $('[data-page="form-view"]').click();
                        break;
                        case "delete":
                            var index = $el.closest('tr').find('td:first').find('div').data('sn'), actiontype = $el.data('action')
                            $scope.NewRecord = $scope.savedRecords[index];
                            var arr = [$el.data("act-type"), 
                                        {hid : $scope.NewRecord.hall_id, uid: $.App.getUID(), pid: $.App.getCurrentPage().page_id,}];

                            $.App.Confirm("Do you want to proceed with the following action?", (res)=>{
                                if(res){
                                    $.App.handleServerRequest(hubName, arr, function (response) {                                        
                                        var res = response.split(','); 
                                        $.App.Alert(res[0],res[1]);
                                        switch(res[1]){
                                            case 'success':
                                                mainPage.fetchRecord();
                                                break;
                                            default:
                                                break;
                                        }       
                                    });
                                }
                            });

                        break;
                    }                    
                },
            }
            return a[action];
        },
        page_event: function(){

            $('body').on('click', '[data-action]', function(){
                var $el = $(this), action = $(this).data('action');
                mainPage.acc_pt($el,action)();
            });
            
        }
    }
      
    $(document).ready(function () {
        mainPage.page_event();
        mainPage.init();
    });

}(jQuery));



