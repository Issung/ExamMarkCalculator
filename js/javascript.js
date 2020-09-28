$(document).ready(function () {

    var jsonUnits = localStorage.getItem('units');
    var units = [];

    if (jsonUnits != null) {
        //debugger;

        units = JSON.parse(jsonUnits);

        for(var i = 0; i < units.length; i++) {
            var name = units[i].name;
            if (name == undefined || name.length < 1) {
                name = 'Untitled Unit'
            }
            $('.sidenav a:last').before(`<a href="#">${name}</a>`);
        }

        OpenUnit(localStorage.getItem('activeUnit'));

        UpdateEverything();
    }
    else {
        AddUnit();
        OpenUnit(0);
    }

    function GetIndexOfSelectedUnit()
    {
        return $('.sidenav a[active]').index();
    }
    
    $('#btn-delete-unit').click(function () {
        if(units.length > 0) {
            var selectedIndex = GetIndexOfSelectedUnit();
            DeleteUnit(selectedIndex);
    
            selectedIndex = (selectedIndex - 1).clamp(0, units.length);
    
            if (units.length == 0)
            {
                AddUnit();
                OpenUnit(0);
                UpdateUnitNameInSideBar();
                UpdateSidebarWidth();
            }
            else
            {
                OpenUnit(selectedIndex);
                UpdateSidebarWidth();
            }
        }
    });

    // Change unit name input.
    $('.main').on('input', '#unit-name', function () {
        UpdateUnitNameInSideBar();
    });

    // Click on unit.
    $('.sidenav').on('click', 'a:not(:last)', function () {
        SaveUnit();

        $('.sidenav a[active]').removeAttr('active');
        $(this).attr('active', '');

        OpenUnit($(this).index());
    });

    // Add new unit click.
    $('#add-unit').click(function () {
        SaveUnit();
        AddUnit();
        OpenUnit(units.length - 1);
        UpdateSidebarWidth();
    });

    function AddUnit() {
        $('.sidenav a:last').before('<a href="#" active>Untitled Unit</a>');
        units.push({assignments: [{name: ''}] });
    }

    function DeleteUnit(index) {
        units.splice(index, 1);
        $(`.sidenav a:eq(${index})`).remove();
    }

    function SaveUnit() {
        var unit = {};
        var assignments = [];

        $('#assignments-table tr:not(:first):not(:last)').each(function () {
            var assignment = {};
            assignment.name = $(this).find('.name').val();
            assignment.weight = $(this).find('.weight').val();
            assignment.mark = $(this).find('.mark').val();
            assignments.push(assignment);
        });

        unit.name = $('#unit-name').val();
        unit.assignments = assignments;

        units[GetIndexOfSelectedUnit()] = unit;
    }

    function OpenUnit(index) {
        var unit = units[index];

        $('.sidenav a[active]').removeAttr('active');
        $(`.sidenav a:eq(${index})`).attr('active', '');

        $('#unit-name').val(unit.name);

        $('#assignments-table tr:not(:first-child):not(:last-child)').remove();

        for(var i = 0; i < unit.assignments.length; i++) {
            $('#assignments-table').find('tr:last').before(`
                <tr>
                    <td> <input type="text" class="name" value="${unit.assignments[i].name}"> </td>
                    <td> <input type="number" min="0" max="100" step="0.01" class="weight" value=${unit.assignments[i].weight}> </td>
                    <td> <input type="number" min="0" max="100" step="0.01" class="mark" value="${unit.assignments[i].mark}"> </td>
                    <td> <input type="number" pattern="[0-9]" min="0" max="100" step="0.01" class="weighted-mark" disabled> </td>
                    <td> <a class="btn-delete-row">&times;</a> </td>
                </tr>
            `);
        }

        UpdateEverything();
    }

    $('#assignments-table').on('input', 'input[type="number"]', function() {
        var max = 100;
        var min = 0;
        if ($(this).val() > max)
        {
            $(this).val(max);
        }
        else if ($(this).val() < min)
        {
            $(this).val(min);
        } 
    });
    
    $('#assignments-table').on('input', '.weight', function(e) {
        UpdateEverything();
    });

    $('#assignments-table').on('input', '.mark', function(e) {
        UpdateEverything();
    });

    $('#btn-add-row').click(function () {
        $('#assignments-table').find('tr:last').prev().after(`
            <tr>
                <td> <input type="text" class="name"> </td>
                <td> <input type="number" min="0" max="100" step="0.01" value="0" class="weight"> </td>
                <td> <input type="number" min="0" max="100" step="0.01" value="0" class="mark"> </td>
                <td> <input type="number" pattern="[0-9]" min="0" max="100" step="0.01" value="0" class="weighted-mark" disabled> </td>
                <td> <a class="btn-delete-row">&times;</a> </td>
            </tr>
        `);
    });

    $('#assignments-table').on('click', '.btn-delete-row', function() {
        $(this).parent().parent().remove();
    });

    function UpdateEverything() {
        UpdateTotals();
        UpdateExamWeight();
        UpdateRequiredMarks();
        UpdateUnitNameInSideBar();
        UpdateSidebarWidth();
    }

    function UpdateTotals() {
        /*var sum = 0;
        $('.weight').each(function () {
            sum += Number($(this).val());
        });

        $('#total-weight').text(sum);*/

        var weightSum = 0;
        var weightedMarkSum = 0;

        $('#assignments-table tr:not(:first):not(:last)').each(function () {
            var weight = Number($(this).find('.weight').val());
            var mark = Number($(this).find('.mark').val());
            var weightedMark = (weight / 100) * mark;

            $(this).find('.weighted-mark').val(weightedMark.toFixed(2));

            weightSum += weight;
            weightedMarkSum += weightedMark;
        });

        $('#total-weight').text(weightSum.toFixed(2));
        $('#total-weighted-mark').text(weightedMarkSum.toFixed(2));
    }

    function UpdateExamWeight() {
        $('#exam-weight').val(100 - Number($('#total-weight').text()).toFixed(2));
    }

    function UpdateRequiredMarks() {
        const HD = 80;
        const DN = 70;
        const CR = 60;
        const PP = 50;

        var totalInternalMark = Number($('#total-weighted-mark').text());
        var examWeight = Number($('#exam-weight').val());

        $('#hd').val(((HD - totalInternalMark) / (examWeight / 100)).toFixed(2));
        $('#dn').val(((DN - totalInternalMark) / (examWeight / 100)).toFixed(2));
        $('#cr').val(((CR - totalInternalMark) / (examWeight / 100)).toFixed(2));
        $('#pp').val(((PP - totalInternalMark) / (examWeight / 100)).toFixed(2));
    }

    function UpdateUnitNameInSideBar() {
        var name = $('#unit-name').val();
        name = name.length < 1 ? 'Untitled Unit' : name;
        $('.sidenav a[active]').text(name);
        UpdateSidebarWidth();
    }

    function UpdateSidebarWidth() {
        $('.main').css('margin-left', $('.sidenav').width() + 5);
        $('#sidenav-footer').css('width', $('.sidenav').width() - 10);
    }

    $(window).on('beforeunload', function () {
        SaveUnit();
    
        localStorage.setItem('units', JSON.stringify(units));
        localStorage.setItem('activeUnit', GetIndexOfSelectedUnit());
    });

    $(window).resize(function () {
        UpdateSidebarWidth();
    });
});

//Utilties

Number.prototype.clamp = function(min, max) {
    return Math.min(Math.max(this, min), max);
};